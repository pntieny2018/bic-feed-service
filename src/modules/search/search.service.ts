import { SentryService } from '@app/sentry';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { FailedProcessPostModel } from '../../database/models/failed-process-post.model';
import { ELASTIC_POST_MAPPING_PATH } from '../../common/constants/elasticsearch.constant';
import { PageDto } from '../../common/dto';
import { ArrayHelper, ElasticsearchHelper, StringHelper } from '../../common/helpers';
import { BodyES } from '../../common/interfaces/body-ealsticsearch.interface';
import { MediaType } from '../../database/models/media.model';
import { IPost, PostType } from '../../database/models/post.model';
import { GroupService } from '../../shared/group';
import { GroupSharedDto } from '../../shared/group/dto';
import { UserService } from '../../shared/user';
import { UserSharedDto } from '../../shared/user/dto';
import { SearchArticlesDto } from '../article/dto/requests';
import { ArticleSearchResponseDto } from '../article/dto/responses/article-search.response.dto';
import { SeriesSearchResponseDto } from '../article/dto/responses/series-search.response.dto';
import { UserDto } from '../auth';
import { PostBindingService } from '../post/post-binding.service';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import { TargetType } from '../report-content/contstants';
import { SearchSeriesDto } from '../series/dto/requests/search-series.dto';
import { SearchPostsDto } from './dto/requests';
import {
  IDataPostToAdd,
  IDataPostToUpdate,
  IPostElasticsearch,
} from './interfaces/post-elasticsearch.interface';

type FieldSearch = {
  default: string;
  ascii: string;
};
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
    protected searchService: ElasticsearchService,
    protected readonly postService: PostService,
    protected readonly sentryService: SentryService,
    protected readonly reactionService: ReactionService,
    protected readonly elasticsearchService: ElasticsearchService,
    protected readonly groupService: GroupService,
    protected readonly userService: UserService,
    protected readonly postBindingService: PostBindingService,
    @InjectModel(FailedProcessPostModel)
    private readonly _failedProcessingPostModel: typeof FailedProcessPostModel
  ) {}

  public async addPostsToSearch(posts: IDataPostToAdd[], defaultIndex?: string): Promise<number> {
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
    if (body.length === 0) return 0;
    try {
      const res = await this.elasticsearchService.bulk(
        {
          refresh: true,
          body,
          pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
        },
        {
          maxRetries: 5,
        }
      );
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
      return res.items.filter((item) => !item.index.error).length;
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
  public async deletePostsToSearch(posts: IPost[]): Promise<void> {
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

  public async updateAttributePostToSearch(post: IPost, dataUpdate: any): Promise<void> {
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

  /*
    Search posts, articles, series
  */
  public async searchPosts(
    authUser: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<any>> {
    const { contentSearch, limit, offset, groupId } = searchPostsDto;
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<any>([], {
        total: 0,
        limit,
        offset,
      });
    }

    let groupIds = user.groups;
    if (groupId) {
      const group = await this.groupService.get(groupId);
      if (!group) {
        throw new BadRequestException(`Group ${groupId} not found`);
      }
      groupIds = this.groupService.getGroupIdAndChildIdsUserJoined(group, authUser);
      if (groupIds.length === 0) {
        return new PageDto<any>([], {
          limit,
          offset,
          hasNextPage: false,
        });
      }
    }

    const notIncludeIds = await this.postService.getEntityIdsReportedByUser(authUser.id, [
      TargetType.POST,
    ]);
    searchPostsDto.notIncludeIds = notIncludeIds;
    const payload = await this.getPayloadSearchForPost(searchPostsDto, groupIds);
    const response = await this.searchService.search<IPostElasticsearch>(payload);
    const hits = response.hits.hits;
    const articleIds = [];
    const attrUserIds = [];
    const attrGroupIds = [];
    const posts = hits.map((item) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _source: source } = item;
      if (source.articles && source.articles.length) {
        articleIds.push(...source.articles.map((article) => article.id));
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
        coverMedia: source.coverMedia ?? null,
        media: source.media || [],
        content: source.content || null,
        title: source.title || null,
        summary: source.summary || null,
        categories: source.categories || [],
        articles: source.articles || [],
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
    const users = await this.userService.getMany(attrUserIds);
    const groups = await this.groupService.getMany(attrGroupIds);
    await Promise.all([
      this.reactionService.bindToPosts(posts),
      this.postBindingService.bindAttributes(posts, [
        'content',
        'commentsCount',
        'totalUsersSeen',
        'setting',
      ]),
    ]);

    let articlesFilterReport = [];
    const articles = await this.postService.getSimpleArticlessByIds(
      ArrayHelper.arrayUnique(articleIds)
    );
    if (articles.length) {
      const articleIdsReported = await this.postService.getEntityIdsReportedByUser(authUser.id, [
        TargetType.ARTICLE,
      ]);

      if (articleIdsReported.length) {
        articlesFilterReport = articles.filter(
          (article) => !articleIdsReported.includes(article.id)
        );
      }
    }
    const result = this.bindResponseSearch(posts, {
      groups,
      users,
      articles: articlesFilterReport,
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
      groups: GroupSharedDto[];
      users: UserSharedDto[];
      articles: any;
    }
  ): any {
    const { groups, users, articles } = dataBinding;
    for (const post of posts) {
      let actor = null;
      const audienceGroups = [];
      const communities = [];
      let mentions = {};
      const media = {
        files: [],
        videos: [],
        images: [],
      };
      const reactionsCount = {};
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

      if (post.articles) {
        post.articles = articles;
      }
      if (post.reactionsCount) {
        post.reactionsCount.forEach(
          (v, i) => (reactionsCount[i] = { [v.reactionName]: parseInt(v.total) })
        );
      }

      if (post.media) {
        post.media
          .sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .forEach((item) => {
            if (item.type === MediaType.VIDEO) media.videos.push(item);
            if (item.type === MediaType.IMAGE) media.images.push(item);
            if (item.type === MediaType.FILE) media.files.push(item);
          });
      }
      post.media = media;
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
  /*
    Search series in article detail
  */
  public async searchSeries(
    authUser: UserDto,
    searchDto: SearchSeriesDto
  ): Promise<PageDto<SeriesSearchResponseDto>> {
    const { limit, offset, groupIds, contentSearch } = searchDto;
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<SeriesSearchResponseDto>([], {
        total: 0,
        limit,
        offset,
      });
    }
    if (!groupIds || groupIds?.length === 0) {
      return new PageDto<SeriesSearchResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }

    const filterGroupIds = this.groupService.filterGroupIdsUsersJoined(groupIds, authUser);
    const payload = await this.getPayloadSearchForSeries({
      contentSearch,
      groupIds: filterGroupIds,
      limit,
      offset,
    });
    const response = await this.searchService.search<IPostElasticsearch>(payload);
    const hits = response.hits.hits;
    const series = hits.map((item) => {
      const source = {
        id: item._source.id,
        groupIds: item._source.groupIds,
        title: item._source.title || null,
      };
      return source;
    });

    await this.postBindingService.bindAudience(series);

    const result = this.classTransformer.plainToInstance(SeriesSearchResponseDto, series, {
      excludeExtraneousValues: true,
    });

    return new PageDto<SeriesSearchResponseDto>(result, {
      total: response['hits'].total['value'],
      limit,
      offset,
    });
  }
  /*
    Search articles in series detail
  */
  public async searchArticles(
    authUser: UserDto,
    searchDto: SearchArticlesDto
  ): Promise<PageDto<ArticleSearchResponseDto>> {
    const { limit, offset, groupIds, categoryIds, contentSearch } = searchDto;
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<ArticleSearchResponseDto>([], {
        total: 0,
        limit,
        offset,
      });
    }
    if (!groupIds && !categoryIds) {
      return new PageDto<ArticleSearchResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }

    let filterGroupIds = authUser.profile.groups;
    if (groupIds) {
      filterGroupIds = this.groupService.filterGroupIdsUsersJoined(groupIds, authUser);
    }
    const notIncludeIds = await this.postService.getEntityIdsReportedByUser(authUser.id, [
      TargetType.ARTICLE,
    ]);
    const context: any = {
      contentSearch,
      groupIds: filterGroupIds,
      notIncludeIds: notIncludeIds,
      limit,
      offset,
    };
    if (categoryIds) context.categoryIds = categoryIds;
    const payload = await this.getPayloadSearchForArticles(context);
    const response = await this.searchService.search<IPostElasticsearch>(payload);
    const hits = response['hits'].hits;
    const articles = hits.map((item) => {
      const source = {
        id: item._source.id,
        summary: item._source.summary,
        coverMedia: item._source.coverMedia,
        createdBy: item._source.createdBy,
        categories: item._source.categories,
        title: item._source.title || null,
      };
      return source;
    });

    await this.postBindingService.bindActor(articles);

    const result = this.classTransformer.plainToInstance(ArticleSearchResponseDto, articles, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleSearchResponseDto>(result, {
      total: response['hits'].total['value'],
      limit,
      offset,
    });
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
            ...this._getTagFilter(tagName),
          ],
          should: [...this._getMatchKeyword(contentSearch)],
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
    limit: number;
    offset: number;
  }): Promise<{
    index: string;
    body: any;
    from: number;
    size: number;
  }> {
    const { contentSearch, groupIds, limit, offset } = props;
    const body: BodyES = {
      query: {
        bool: {
          must: [...this._getMatchPrefixKeyword('title', contentSearch)],
          filter: [...this._getTypeFilter(PostType.SERIES), ...this._getAudienceFilter(groupIds)],
        },
      },
    };

    body['sort'] = [...this._getSort(contentSearch)];
    return {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      body,
      from: offset,
      size: limit,
    };
  }

  public async getPayloadSearchForArticles(props: {
    contentSearch: string;
    groupIds: string[];
    categoryIds?: string[];
    notIncludeIds?: string[];
    limit: number;
    offset: number;
  }): Promise<{
    index: string;
    body: any;
    from: number;
    size: number;
  }> {
    const { contentSearch, groupIds, categoryIds, limit, offset, notIncludeIds } = props;
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
    if (groupIds.length) {
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

  private _getMatchKeyword(keyword: string): any {
    if (keyword) {
      const { content, title, summary } = ELASTIC_POST_MAPPING_PATH;
      const queryContent = this._getQueryMatchKeyword(content, keyword);
      const queryTitle = this._getQueryMatchKeyword(title, keyword);
      const querySummary = this._getQueryMatchKeyword(summary, keyword);

      return [...queryContent, ...querySummary, ...queryTitle];
    }
    return [];
  }

  private _getSort(textSearch: string): any {
    if (textSearch) {
      return [{ ['_score']: 'desc' }, { createdAt: 'desc' }];
    } else {
      return [{ createdAt: 'desc' }];
    }
  }

  private _getQueryMatchKeyword(field: FieldSearch, keyword: string): any[] {
    let queries;
    const isASCII = this._isASCIIKeyword(keyword);
    if (isASCII) {
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: keyword,
            fields: [field.default, field.ascii],
            type: 'phrase', //Match pharse with high priority
          },
        },
        {
          match: {
            [field.default]: {
              query: keyword,
            },
          },
        },
        {
          match: {
            [field.ascii]: {
              query: keyword,
            },
          },
        },
      ];
    } else {
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: keyword,
            fields: [field.default],
            type: 'phrase',
          },
        },
        {
          match: {
            [field.default]: {
              query: keyword,
            },
          },
        },
      ];
    }

    return queries;
  }

  private _isASCIIKeyword(keyword: string): boolean {
    const arrKeywords = keyword.split(' ');
    const isASCII = arrKeywords.every((i) => StringHelper.isASCII(i));
    return isASCII;
  }
}
