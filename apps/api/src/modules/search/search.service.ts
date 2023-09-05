import { SentryService } from '@app/sentry';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { FailedProcessPostModel } from '../../database/models/failed-process-post.model';
import { ELASTIC_POST_MAPPING_PATH } from '../../common/constants/elasticsearch.constant';
import { PageDto } from '../../common/dto';
import { ArrayHelper, ElasticsearchHelper, StringHelper } from '../../common/helpers';
import { BodyES } from '../../common/interfaces/body-ealsticsearch.interface';
import { IPost, PostType } from '../../database/models/post.model';
import { PostBindingService } from '../post/post-binding.service';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import { TargetType } from '../report-content/contstants';
import { SearchPostsDto } from './dto/requests';
import {
  IDataPostToAdd,
  IDataPostToDelete,
  IDataPostToUpdate,
  IPostElasticsearch,
} from './interfaces/post-elasticsearch.interface';
import { IUserApplicationService, USER_APPLICATION_TOKEN, UserDto } from '../v2-user/application';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../v2-post/domain/repositoty-interface';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../v2-group/application';
import { TagService } from '../tag/tag.service';
import { RULES } from '../v2-post/constant';
import { QuizStatus } from '../v2-post/data-type';
import { QuizDto } from '../v2-post/application/dto';
import { IPostSearchQuery } from './interfaces';
import {
  ScrollRequest,
  ScrollResponse,
  SearchRequest,
  SearchResponse,
} from '@elastic/elasticsearch/lib/api/types';

@Injectable()
export class SearchService {
  /**
   * Logger
   * @protected
   */
  protected logger = new Logger(SearchService.name);

  /**
   *  ClassTransformer
   * @protected
   */
  protected classTransformer = new ClassTransformer();

  public constructor(
    protected readonly postService: PostService,
    protected readonly sentryService: SentryService,
    protected readonly reactionService: ReactionService,
    protected readonly elasticsearchService: ElasticsearchService,
    protected readonly tagService: TagService,
    @Inject(GROUP_APPLICATION_TOKEN)
    protected readonly appGroupService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly userAppService: IUserApplicationService,
    protected readonly postBindingService: PostBindingService,
    @InjectModel(FailedProcessPostModel)
    private readonly _failedProcessingPostModel: typeof FailedProcessPostModel,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository
  ) {}

  public async addPostsToSearch(
    posts: IDataPostToAdd[],
    defaultIndex?: string
  ): Promise<{ totalCreated: number; totalUpdated: number }> {
    const index = defaultIndex ? defaultIndex : ElasticsearchHelper.ALIAS.POST.default.name;
    const body = [];
    for (const post of posts) {
      if (post.isHidden === true) continue;
      if (post.type === PostType.ARTICLE) {
        post.content = StringHelper.serializeEditorContentToText(post.content);
      }
      if (post.type === PostType.POST) {
        post.content = StringHelper.removeMarkdownCharacter(post.content);
      }
      // eslint-disable-next-line @typescript-eslint/naming-convention
      body.push({ index: { _index: index, _id: post.id } });
      body.push(post);
    }
    if (body.length === 0) return { totalUpdated: 0, totalCreated: 0 };
    try {
      const res = await this.elasticsearchService.bulk({
        refresh: true,
        body,
        pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
      });
      if (res.errors === true) {
        const errorItems = res.items.filter((item) => item.index.error);
        this.logger.debug(`[ERROR index posts] ${errorItems}`);
        this._failedProcessingPostModel
          .bulkCreate(
            errorItems.map((it) => ({
              postId: it.index._id,
              reason: JSON.stringify(it.index.error),
              postJson: JSON.stringify(posts.find((p) => p.id === it.index._id)),
            }))
          )
          .catch((err) => this.logger.error(JSON.stringify(err?.stack)));
      }
      await this._updateLangAfterIndexToES(res?.items || [], index);
      let totalCreated = 0;
      let totalUpdated = 0;
      res.items.map((item) => {
        if (item.index.result === 'created') totalCreated++;
        if (item.index.result === 'updated') totalUpdated++;
      });
      return {
        totalCreated,
        totalUpdated,
      };
    } catch (e) {
      this.logger.debug(JSON.stringify(e?.stack));
      this.sentryService.captureException(e);
    }
  }

  private async _updateLangAfterIndexToES(resItems: any[], index: string): Promise<void> {
    const groupSuccessItemsByLang = [];
    resItems.forEach(({ index: resPost }) => {
      if (resPost.status === 201) {
        const lang = ElasticsearchHelper.getLangOfPostByIndexName(resPost._index, index);
        const postId = resPost._id;

        const foundIndex = groupSuccessItemsByLang.findIndex((item) => item.lang === lang);
        if (foundIndex === -1) {
          groupSuccessItemsByLang.push({ lang, ids: [postId] });
        } else {
          groupSuccessItemsByLang[foundIndex].ids.push(postId);
        }
      }
    });

    for (const item of groupSuccessItemsByLang) {
      await this.postService.updateData(item.ids, {
        lang: item.lang,
      });
    }
  }

  public async updatePostsToSearch(posts: IDataPostToUpdate[]): Promise<void> {
    const index = ElasticsearchHelper.ALIAS.POST.default.name;
    for (const dataIndex of posts) {
      if (dataIndex.isHidden === true) continue;
      if (dataIndex.type === PostType.ARTICLE) {
        dataIndex.content = StringHelper.serializeEditorContentToText(dataIndex.content);
      }
      if (dataIndex.type === PostType.POST) {
        dataIndex.content = StringHelper.removeMarkdownCharacter(dataIndex.content);
      }

      try {
        const res = await this.elasticsearchService.index({
          index,
          id: dataIndex.id,
          body: dataIndex,
          pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
        });
        const newLang = ElasticsearchHelper.getLangOfPostByIndexName(res._index);
        if (dataIndex.lang !== newLang) {
          await this.postService.updateData([dataIndex.id], { lang: newLang });
          const oldIndex = ElasticsearchHelper.getIndexOfPostByLang(dataIndex.lang);
          await this.elasticsearchService.delete({ index: oldIndex, id: `${dataIndex.id}` });
        }
      } catch (e) {
        this.logger.debug(JSON.stringify(e?.stack));
        this.sentryService.captureException(e);
      }
    }
  }
  public async deletePostsToSearch(posts: IDataPostToDelete[]): Promise<void> {
    try {
      for (const post of posts) {
        await this.elasticsearchService.deleteByQuery({
          index: ElasticsearchHelper.ALIAS.POST.all.name,
          query: {
            term: {
              id: post.id,
            },
          },
        });
      }
    } catch (e) {
      this.logger.debug(JSON.stringify(e?.stack));
      this.sentryService.captureException(e);
    }
  }

  public async updateAttributePostToSearch(post: IPost, dataUpdate: unknown): Promise<void> {
    const index = ElasticsearchHelper.getIndexOfPostByLang(post.lang);
    try {
      await this.elasticsearchService.update({
        index,
        id: post.id,
        body: {
          doc: dataUpdate,
        },
      });
    } catch (e) {
      this.logger.debug(JSON.stringify(e?.stack));
      this.sentryService.captureException(e);
    }
  }

  public async updateAttributePostsToSearch(posts: IPost[], dataUpdate: unknown): Promise<void> {
    const updateOps = [];
    posts.forEach((post, indexPost) => {
      const index = ElasticsearchHelper.getIndexOfPostByLang(post.lang);
      updateOps.push({
        update: {
          _index: index,
          _id: post.id,
        },
      });
      updateOps.push({
        doc: dataUpdate[indexPost],
      });
    });
    if (updateOps.length === 0) return;
    try {
      await this.elasticsearchService.bulk(
        {
          refresh: true,
          body: updateOps,
          pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
        },
        {
          maxRetries: 5,
        }
      );
    } catch (e) {
      this.logger.debug(JSON.stringify(e?.stack));
      this.sentryService.captureException(e);
    }
  }

  public async search<T>(payload: SearchRequest): Promise<SearchResponse<T>> {
    return this.elasticsearchService.search(payload);
  }

  public async scroll<T>(payload: ScrollRequest): Promise<ScrollResponse<T>> {
    return this.elasticsearchService.scroll(payload);
  }

  /*
    Search posts, articles, series
  */
  public async searchPosts(
    authUser: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<any>> {
    const { contentSearch, limit, offset, groupId, tagName } = searchPostsDto;
    const user = authUser;
    if (!user || user.groups.length === 0) {
      return new PageDto<any>([], {
        total: 0,
        limit,
        offset,
      });
    }

    let groupIds = user.groups;
    let tagId;
    if (groupId) {
      const group = await this.appGroupService.findOne(groupId);
      if (!group) {
        throw new BadRequestException(`Group ${groupId} not found`);
      }
      groupIds = this.appGroupService.getGroupIdAndChildIdsUserJoined(group, authUser.groups);
      if (groupIds.length === 0) {
        return new PageDto<any>([], {
          limit,
          offset,
          hasNextPage: false,
        });
      }
      if (tagName) {
        tagId = await this.tagService.findTag(tagName, groupId);
        if (tagId) {
          searchPostsDto.tagId = tagId;
        }
      }
    }

    const notIncludeIds = await this.postService.getEntityIdsReportedByUser(authUser.id, [
      TargetType.POST,
    ]);
    searchPostsDto.notIncludeIds = notIncludeIds;
    const payload = await this.getPayloadSearchForPost(searchPostsDto, groupIds);
    const response = await this.elasticsearchService.search<IPostElasticsearch>(payload);
    const hits = response.hits.hits;
    const itemIds = []; //post or article
    const attrUserIds = [];
    const attrGroupIds = [];
    const posts = hits.map((item) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _source: source } = item;
      if (source.items && source.items.length) {
        itemIds.push(...source.items.map((item) => item.id));
      }
      attrUserIds.push(source.createdBy);
      if (source.mentionUserIds) attrUserIds.push(...source.mentionUserIds);
      attrGroupIds.push(...source.groupIds);
      attrGroupIds.push(...source.communityIds);
      const data: any = {
        id: source.id,
        groupIds: source.groupIds,
        communityIds: source.communityIds,
        mentionUserIds: source.mentionUserIds,
        type: source.type,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        createdBy: source.createdBy,
        publishedAt: source.publishedAt,
        coverMedia: source.coverMedia ?? null,
        media: source.media || {
          files: [],
          images: [],
          videos: [],
        },
        content: source.content || null,
        title: source.title || null,
        summary: source.summary || null,
        categories: source.categories || [],
        items: source.items || [],
        tags: source.tags || [],
      };

      if (contentSearch && item.highlight && item.highlight['content']?.length && source.content) {
        data.highlight = item.highlight['content'][0];
      }

      if (contentSearch && item.highlight && item.highlight['title']?.length && source.title) {
        data.titleHighlight = item.highlight['title'][0];
      }

      if (contentSearch && item.highlight && item.highlight['summary']?.length && source.summary) {
        data.summaryHighlight = item.highlight['summary'][0];
      }
      return data;
    });
    const users = await this.userAppService.findAllAndFilterByPersonalVisibility(
      attrUserIds,
      authUser.id
    );
    const groups = await this.appGroupService.findAllByIds(attrGroupIds);
    const quizEntities = await this._quizRepository.findAll({
      where: {
        contentIds: posts.map((post) => post.id),
        status: QuizStatus.PUBLISHED,
      },
    });
    await Promise.all([
      this.reactionService.bindToPosts(posts),
      this.postBindingService.bindAttributes(posts, [
        'content',
        'commentsCount',
        'totalUsersSeen',
        'setting',
        'wordCount',
      ]),
    ]);

    let articlesFilterReport = [];

    const itemsInSeries = await this.postService.getSimplePostsByIds(
      ArrayHelper.arrayUnique(itemIds)
    );
    if (itemsInSeries.length) {
      const articleIdsReported = await this.postService.getEntityIdsReportedByUser(authUser.id, [
        TargetType.ARTICLE,
        TargetType.POST,
      ]);
      if (articleIdsReported.length) {
        articlesFilterReport = itemsInSeries.filter(
          (article) => !articleIdsReported.includes(article.id)
        );
      } else {
        articlesFilterReport = itemsInSeries;
      }
    }

    const quizzesMapper = new Map<string, Partial<QuizDto>>(
      quizEntities.map((quiz) => {
        return [
          quiz.get('contentId'),
          new QuizDto({
            id: quiz.get('id'),
            title: quiz.get('title'),
            description: quiz.get('description'),
            status: quiz.get('status'),
            genStatus: quiz.get('genStatus'),
          }),
        ];
      })
    );

    const result = this.bindResponseSearch(posts, {
      groups,
      users,
      articles: articlesFilterReport,
      quizzesMapper,
    });
    return new PageDto<any>(result, {
      total: response.hits.total['value'],
      limit,
      offset,
    });
  }

  public bindResponseSearch(
    posts: any,
    dataBinding: {
      groups: GroupDto[];
      users: UserDto[];
      articles: any;
      quizzesMapper: Map<string, Partial<QuizDto>>;
    }
  ): any {
    const { groups, users, articles, quizzesMapper } = dataBinding;
    for (const post of posts) {
      let actor = null;
      const audienceGroups = [];
      const communities = [];
      let mentions = {};
      const reactionsCount = [];
      post.quiz = quizzesMapper.get(post.id);
      for (const group of groups) {
        if (post.groupIds && post.groupIds.includes(group.id)) {
          audienceGroups.push({
            id: group.id,
            name: group.name,
            communityId: group.communityId,
            icon: group.icon,
            privacy: group.privacy,
            isCommunity: group.isCommunity,
            rootGroupId: group.rootGroupId,
          });
        }
        if (post.communityIds && post.communityIds.includes(group.id)) {
          communities.push({
            id: group.id,
            name: group.name,
            communityId: group.communityId,
            icon: group.icon,
            privacy: group.privacy,
          });
        }
      }

      const mentionList = [];
      for (const user of users) {
        if (user.id === post.createdBy) {
          actor = {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            showingBadges: user.showingBadges,
            isVerified: user.isVerified,
          };
        }
        if (post.mentionUserIds && post.mentionUserIds.includes(user.id)) {
          mentionList.push({
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
          });
        }
        mentions = mentionList.reduce((obj, cur) => ({ ...obj, [cur.username]: cur }), {});
      }

      if (post.items) {
        const bindArticles = [];
        post.items.sort((a, b) => {
          return a.zindex - b.zindex;
        });
        for (const itemInSeries of post.items) {
          const findArticle = articles.find((item) => item.id === itemInSeries.id);
          if (findArticle) bindArticles.push(findArticle);
        }
        post.items = bindArticles;
      }
      if (post.reactionsCount) {
        post.reactionsCount.forEach(
          (v, i) => (reactionsCount[i] = { [v.reactionName]: parseInt(v.total) })
        );
      }

      post.reactionsCount = reactionsCount;
      post.audience = { groups: audienceGroups };
      post.communities = communities;
      post.actor = actor;
      post.mentions = mentions;
      delete post.groupIds;
      delete post.mentionUserIds;
      delete post.communityIds;
      delete post.zindex;
    }
    return posts;
  }

  public async getPayloadSearchForPost(
    {
      startTime,
      endTime,
      contentSearch,
      actors,
      limit,
      offset,
      type,
      notIncludeIds,
      tagName,
      tagId,
      limitSeries,
    }: SearchPostsDto,
    groupIds: string[]
  ): Promise<{
    index: string;
    body: any;
    from: number;
    size: number;
  }> {
    const body: BodyES = {
      query: {
        bool: {
          must: [],
          // eslint-disable-next-line @typescript-eslint/naming-convention
          must_not: [...this._getNotIncludeIds(notIncludeIds)],
          filter: [
            ...this._getActorFilter(actors),
            ...this._getTypeFilter(type),
            ...this._getAudienceFilter(groupIds),
            ...this._getFilterTime(startTime, endTime),
            ...(tagId ? this._getTagIdFilter(tagId) : this._getTagFilter(tagName)),
            ...(limitSeries ? this._limitSeriesFilter() : []),
          ],
          should: [...this._getMatchKeyword(type, contentSearch)],
          // eslint-disable-next-line @typescript-eslint/naming-convention
          minimum_should_match: contentSearch ? 1 : 0,
        },
      },
    };

    if (contentSearch) {
      body['highlight'] = this._getHighlight();
    }

    body['sort'] = [...this._getSort(contentSearch)];
    return {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      body,
      from: offset,
      size: limit,
    };
  }

  public async getPayloadSearchForSeries(props: {
    contentSearch: string;
    groupIds: string[];
    itemIds: string[];
    limit: number;
    offset: number;
  }): Promise<{
    index: string;
    body: any;
    from: number;
    size: number;
  }> {
    const { contentSearch, groupIds, itemIds, limit, offset } = props;
    const bool = {
      must: [],
      filter: [...this._getTypeFilter(PostType.SERIES)],
    };
    if (contentSearch) {
      bool.must = [...this._getMatchPrefixKeyword('title', contentSearch)];
    }

    if (groupIds && groupIds.length) {
      bool.filter.push(...this._getAudienceFilter(groupIds));
    }
    if (itemIds && itemIds.length) {
      bool.filter.push(...this._getItemInSeriesFilter(itemIds));
    }

    const body: BodyES = {
      query: { bool },
    };

    body['sort'] = [...this._getSort(contentSearch)];
    return {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      body,
      from: offset,
      size: limit,
    };
  }

  public getPayloadSearchForArticles(props: {
    contentSearch: string;
    groupIds: string[];
    categoryIds?: string[];
    notIncludeIds?: string[];
    limit: number;
    offset: number;
    limitSeries?: number;
  }): {
    index: string;
    body: any;
    from: number;
    size: number;
  } {
    const { contentSearch, groupIds, categoryIds, limit, offset, notIncludeIds, limitSeries } =
      props;
    const body: BodyES = {
      query: {
        bool: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          filter: [...this._getTypeFilter(PostType.ARTICLE)],
        },
      },
    };
    if (notIncludeIds) {
      body.query.bool.must_not = [...this._getNotIncludeIds(notIncludeIds)];
    }
    if (contentSearch) {
      body.query.bool.should = [
        ...this._getMatchPrefixKeyword('title', contentSearch),
        ...this._getMatchPrefixKeyword('summary', contentSearch),
      ];
      body.query.bool.minimum_should_match = 1;
    }

    if (categoryIds && categoryIds.length) {
      body.query.bool.filter.push(...this._getCategoryFilter(categoryIds));
    }
    if (groupIds && groupIds.length) {
      body.query.bool.filter.push(...this._getAudienceFilter(groupIds));
    }
    if (limitSeries) {
      body.query.bool.filter.push(...this._limitSeriesFilter());
    }

    body['sort'] = [...this._getSort(contentSearch)];
    return {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      body,
      from: offset,
      size: limit,
    };
  }

  private _getHighlight(): any {
    const { content, summary, title } = ELASTIC_POST_MAPPING_PATH;
    return {
      ['pre_tags']: ['=='],
      ['post_tags']: ['=='],
      fields: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        content: {
          ['matched_fields']: [content.default, content.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        summary: {
          ['matched_fields']: [summary.default, summary.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        title: {
          ['matched_fields']: [title.default, title.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
      },
    };
  }

  private _getFilterTime(startTime: string, endTime: string): any {
    if (startTime || endTime) {
      const filterTime = {
        range: {
          createdAt: {},
        },
      };

      if (startTime) filterTime.range.createdAt['gte'] = startTime;
      if (endTime) filterTime.range.createdAt['lte'] = endTime;
      return [filterTime];
    }
    return [];
  }

  private _getActorFilter(actors: string[]): any {
    const { createdBy } = ELASTIC_POST_MAPPING_PATH;
    if (actors && actors.length) {
      return [
        {
          terms: {
            [createdBy]: actors,
          },
        },
      ];
    }
    return [];
  }

  private _getNotIncludeIds(ids: string[]): any {
    const { id } = ELASTIC_POST_MAPPING_PATH;
    if (ids && ids.length) {
      return [
        {
          terms: {
            [id]: ids,
          },
        },
      ];
    }
    return [];
  }

  private _getTypeFilter(postType: PostType): any {
    const { type } = ELASTIC_POST_MAPPING_PATH;
    if (postType) {
      return [
        {
          term: {
            [type]: postType,
          },
        },
      ];
    }
    return [];
  }

  private _getTagFilter(tagName: string): any {
    const { tags } = ELASTIC_POST_MAPPING_PATH;
    if (tagName) {
      return [
        {
          term: {
            [tags.name]: tagName,
          },
        },
      ];
    }
    return [];
  }

  private _getTagIdFilter(tagId: string): any {
    const { tags } = ELASTIC_POST_MAPPING_PATH;
    if (tagId) {
      return [
        {
          term: {
            [tags.id]: tagId,
          },
        },
      ];
    }
    return [];
  }

  private _getCategoryFilter(categoryIds: string[]): any {
    const { categories } = ELASTIC_POST_MAPPING_PATH;
    if (categoryIds) {
      return [
        {
          terms: {
            [categories.id]: categoryIds,
          },
        },
      ];
    }
    return [];
  }

  private _getAudienceFilter(filterGroupIds: string[]): any {
    const { groupIds } = ELASTIC_POST_MAPPING_PATH;
    if (filterGroupIds.length) {
      return [
        {
          terms: {
            [groupIds]: filterGroupIds,
          },
        },
      ];
    }

    return [];
  }

  private _getItemInSeriesFilter(filterItemIds: string[]): any {
    const { items } = ELASTIC_POST_MAPPING_PATH;
    if (filterItemIds.length) {
      return [
        {
          terms: {
            [items.id]: filterItemIds,
          },
        },
      ];
    }

    return [];
  }

  private _getMatchPrefixKeyword(key: string, keyword: string): any {
    if (keyword) {
      return [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          match_phrase_prefix: {
            [key]: {
              query: keyword,
            },
          },
        },
      ];
    }
    return [];
  }

  private _limitSeriesFilter(): any {
    const { seriesIds } = ELASTIC_POST_MAPPING_PATH;
    return [
      {
        script: {
          script: {
            inline: `doc['${seriesIds}'].length < ${RULES.LIMIT_ATTACHED_SERIES} `,
          },
        },
      },
    ];
  }

  private _getMatchKeyword(type: PostType, keyword: string): any {
    if (!keyword) return [];
    let queries;
    let fields;
    const { title, summary, content } = ELASTIC_POST_MAPPING_PATH;
    const isASCII = StringHelper.isASCII(keyword);
    if (isASCII) {
      //En
      if (type === PostType.POST) {
        fields = [content.ascii, content.default];
      } else if (type === PostType.SERIES) {
        fields = [title.ascii, title.default, summary.ascii, summary.default];
      } else {
        // for article or all
        fields = [
          title.ascii,
          title.default,
          summary.ascii,
          summary.default,
          content.ascii,
          content.default,
        ];
      }
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: keyword,
            fields,
          },
        },
      ];
    } else {
      //Vi
      if (type === PostType.POST) {
        fields = [title.default];
      } else if (type === PostType.SERIES) {
        fields = [title.default, summary.default];
      } else {
        fields = [title.default, summary.default, content.default];
      }
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: keyword,
            fields,
          },
        },
      ];
    }

    return queries;
  }

  private _getSort(textSearch: string): any {
    if (textSearch) {
      return [{ ['_score']: 'desc' }, { createdAt: 'desc' }];
    } else {
      return [{ createdAt: 'desc' }];
    }
  }

  public async updateSeriesAtrributeForPostSearch(ids: string[]): Promise<void> {
    const posts = await this.postService.getPostsWithSeries(ids);
    for (const post of posts) {
      await this.updateAttributePostToSearch(post, {
        seriesIds: post.postSeries.map((series) => series.seriesId),
      });
    }
  }

  private _getMatchQueryFromKeyword(types: PostType[], keyword: string): any {
    if (!keyword) return [];
    let queries: any[];
    let fields: string[];
    const { title, summary, content } = ELASTIC_POST_MAPPING_PATH;
    const isASCII = StringHelper.isASCII(keyword);
    if (isASCII) {
      //En
      if (ArrayHelper.hasOnlyOneElement(types, PostType.POST)) {
        fields = [content.ascii, content.default];
      } else if (ArrayHelper.hasOnlyOneElement(types, PostType.SERIES)) {
        fields = [title.ascii, title.default, summary.ascii, summary.default];
      } else {
        // for article or all
        fields = [
          title.ascii,
          title.default,
          summary.ascii,
          summary.default,
          content.ascii,
          content.default,
        ];
      }
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: keyword,
            fields,
          },
        },
      ];
    } else {
      //Vi
      if (ArrayHelper.hasOnlyOneElement(types, PostType.POST)) {
        fields = [title.default];
      } else if (ArrayHelper.hasOnlyOneElement(types, PostType.SERIES)) {
        fields = [title.default, summary.default];
      } else {
        fields = [title.default, summary.default, content.default];
      }
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: keyword,
            fields,
          },
        },
      ];
    }

    return queries;
  }

  private _getContentTypesFilter(postTypes: PostType[]): any {
    const { type } = ELASTIC_POST_MAPPING_PATH;
    if (postTypes) {
      return [
        {
          bool: {
            should: postTypes.map((contentType) => ({
              term: {
                [type]: contentType,
              },
            })),
          },
        },
      ];
    }
    return [];
  }

  private _getTagIdsFilter(tagIds: string[]): any {
    const { tags } = ELASTIC_POST_MAPPING_PATH;
    if (tagIds) {
      return [
        {
          term: {
            [tags.id]: tagIds,
          },
        },
      ];
    }
    return [];
  }

  public getPayloadSearchForContent(query: IPostSearchQuery): BodyES {
    const {
      startTime,
      endTime,
      keyword,
      contentTypes,
      actors,
      tags,
      topics,
      excludeByIds,
      groupIds,
    } = query;
    const body: BodyES = {
      query: {
        bool: {
          must: [],
          // eslint-disable-next-line @typescript-eslint/naming-convention
          must_not: [...this._getNotIncludeIds(excludeByIds)],
          filter: [
            ...this._getActorFilter(actors),
            ...this._getContentTypesFilter(contentTypes),
            ...this._getAudienceFilter(groupIds),
            ...this._getFilterTime(startTime, endTime),
            ...(tags ? this._getTagIdsFilter(tags) : []),
            ...(topics ? this._getCategoryFilter(topics) : []),
          ],
          should: [...this._getMatchQueryFromKeyword(contentTypes, keyword)],
          // eslint-disable-next-line @typescript-eslint/naming-convention
          minimum_should_match: keyword ? 1 : 0,
        },
      },
    };

    if (keyword) {
      body['highlight'] = this._getHighlight();
    }

    body['sort'] = [...this._getSort(keyword)];

    return body;
  }

  /*
    Search posts, articles, series
  */
  public async searchContent(params: IPostSearchQuery): Promise<any> {
    const { keyword } = params;
    const body = this.getPayloadSearchForContent(params);
    const payload = {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      ...body,
      scroll: '1m',
      size: 1,
    };
    const response = await this.elasticsearchService.search<IPostElasticsearch>(payload);
    const hits = response.hits.hits;
    const itemIds = []; //post or article
    const attrUserIds = [];
    const attrGroupIds = [];
    const posts = hits.map((item) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _source: source } = item;
      if (source.items && source.items.length) {
        itemIds.push(...source.items.map((item) => item.id));
      }
      attrUserIds.push(source.createdBy);
      if (source.mentionUserIds) attrUserIds.push(...source.mentionUserIds);
      attrGroupIds.push(...source.groupIds);
      attrGroupIds.push(...source.communityIds);
      const data: any = {
        id: source.id,
        groupIds: source.groupIds,
        communityIds: source.communityIds,
        mentionUserIds: source.mentionUserIds,
        type: source.type,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        createdBy: source.createdBy,
        publishedAt: source.publishedAt,
        coverMedia: source.coverMedia ?? null,
        media: source.media || {
          files: [],
          images: [],
          videos: [],
        },
        content: source.content || null,
        title: source.title || null,
        summary: source.summary || null,
        categories: source.categories || [],
        items: source.items || [],
        tags: source.tags || [],
      };

      if (keyword && item.highlight && item.highlight['content']?.length && source.content) {
        data.highlight = item.highlight['content'][0];
      }

      if (keyword && item.highlight && item.highlight['title']?.length && source.title) {
        data.titleHighlight = item.highlight['title'][0];
      }

      if (keyword && item.highlight && item.highlight['summary']?.length && source.summary) {
        data.summaryHighlight = item.highlight['summary'][0];
      }
      return data;
    });

    return posts;
  }
}
