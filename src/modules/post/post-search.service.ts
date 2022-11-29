import { SentryService } from '@app/sentry';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClassTransformer } from 'class-transformer';
import { ELASTIC_POST_MAPPING_PATH } from '../../common/constants/elasticsearch.constant';
import { PageDto } from '../../common/dto';
import { ElasticsearchHelper, StringHelper } from '../../common/helpers';
import { BodyES } from '../../common/interfaces/body-ealsticsearch.interface';
import { IPost, PostType } from '../../database/models/post.model';
import { GroupService } from '../../shared/group';
import { UserSharedDto } from '../../shared/user/dto';
import { SearchArticlesDto } from '../article/dto/requests';
import { ArticleResponseDto, CategoryResponseDto } from '../article/dto/responses';
import { ArticleSearchResponseDto } from '../article/dto/responses/article-search.response.dto';
import { SeriesSearchResponseDto } from '../article/dto/responses/series-search.response.dto';
import { UserDto } from '../auth';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { MediaFilterResponseDto, MediaResponseDto } from '../media/dto/response';
import { UserMentionDto } from '../mention/dto';
import { ReactionService } from '../reaction';
import { SearchSeriesDto } from '../series/dto/requests/search-series.dto';
import { PostSettingDto } from './dto/common/post-setting.dto';
import { SearchPostsDto } from './dto/requests';
import { AudienceResponseDto } from './dto/responses';
import {
  IPostElasticsearch,
  IPostResponseElasticsearch,
} from './interfaces/post-response-elasticsearch.interface';
import { PostBindingService } from './post-binding.service';
import { PostService } from './post.service';

export type DataPostToAdd = {
  id: string;
  commentsCount: number;
  totalUsersSeen: number;
  content?: string;
  media?: MediaFilterResponseDto;
  mentions?: UserMentionDto;
  audience: AudienceResponseDto;
  setting?: PostSettingDto;
  createdAt: Date;
  actor: UserSharedDto;
  type: PostType;
  title?: string;
  summary?: string;
  community?: { id: string; name: string };
  categories?: { id: string; name: string }[];
  articleIds?: string[];
  coverMedia?: MediaResponseDto;
};
type DataPostToUpdate = DataPostToAdd & {
  lang: string;
};
type FieldSearch = {
  text: {
    default: string;
    ascii: string;
  };
};
@Injectable()
export class PostSearchService {
  /**
   * Logger
   * @protected
   */
  protected logger = new Logger(PostSearchService.name);

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
    protected readonly postBindingService: PostBindingService,
    protected readonly linkPreviewService: LinkPreviewService,
    protected readonly groupService: GroupService
  ) {}

  public async addPostsToSearch(posts: DataPostToAdd[], defaultIndex?: string): Promise<void> {
    const index = defaultIndex ? defaultIndex : ElasticsearchHelper.ALIAS.POST.default.name;
    const body = [];
    for (const post of posts) {
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

      await this._updateLangAfterIndexToES(res?.items || [], index);
    } catch (e) {
      this.logger.debug(e);
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

  public async updatePostsToSearch(posts: DataPostToUpdate[]): Promise<void> {
    const index = ElasticsearchHelper.ALIAS.POST.default.name;
    for (const dataIndex of posts) {
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
        this.logger.debug(e);
        this.sentryService.captureException(e);
      }
    }
  }
  public async deletePostsToSearch(posts: IPost[]): Promise<void> {
    for (const post of posts) {
      const index = ElasticsearchHelper.getIndexOfPostByLang(post.lang);
      this.elasticsearchService.delete({ index, id: post.id }).catch((e) => {
        this.sentryService.captureException(e);
      });
    }
  }

  /*
    Search posts, articles, series
  */
  public async searchPosts(
    authUser: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { contentSearch, limit, offset, groupId } = searchPostsDto;
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<ArticleResponseDto>([], {
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
        return new PageDto<ArticleResponseDto>([], {
          limit,
          offset,
          hasNextPage: false,
        });
      }
    }

    const payload = await this.getPayloadSearchForPost(searchPostsDto, groupIds);
    const response = await this.searchService.search<IPostElasticsearch>(payload);
    const hits = response.hits.hits;
    const posts = hits.map((item) => {
      const source: IPostResponseElasticsearch = {
        id: item._source.id,
        audience: item._source.audience,
        type: item._source.type,
        media: item._source.media,
        content: item._source.content.text,
        title: item._source.title?.text || null,
        summary: item._source.summary?.text || null,
        setting: item._source.setting,
        actor: item._source.actor,
        mentions: item._source.mentions,
        createdAt: item._source.createdAt,
        totalUsersSeen: item._source.totalUsersSeen,
        commentsCount: item._source.commentsCount,
        coverMedia: item._source.coverMedia ?? null,
      };
      if (
        contentSearch &&
        item.highlight &&
        item.highlight['content.text']?.length &&
        source.content
      ) {
        source.highlight = item.highlight['content.text'][0];
      }

      if (contentSearch && item.highlight && item.highlight['title.text']?.length && source.title) {
        source.titleHighlight = item.highlight['title.text'][0];
      }

      if (
        contentSearch &&
        item.highlight &&
        item.highlight['summary.text']?.length &&
        source.summary
      ) {
        source.summaryHighlight = item.highlight['summary.text'][0];
      }
      return source;
    });

    await Promise.all([
      this.reactionService.bindToPosts(posts),
      this.postBindingService.bindActor(posts),
      this.postBindingService.bindAudience(posts),
      this.postBindingService.bindAttributes(posts, [
        'content',
        'commentsCount',
        'totalUsersSeen',
        'setting',
      ]),
      this.linkPreviewService.bindToPosts(posts),
    ]);

    const result = this.classTransformer.plainToInstance(ArticleResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleResponseDto>(result, {
      total: response.hits.total['value'],
      limit,
      offset,
    });
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
      const source: SeriesSearchResponseDto = {
        id: item._source.id,
        audience: item._source.audience,
        title: item._source.title?.text || null,
      };
      return source;
    });

    await this.postBindingService.bindAudience(series);

    const result = this.classTransformer.plainToInstance(SeriesSearchResponseDto, series, {
      excludeExtraneousValues: true,
    });

    return new PageDto<SeriesSearchResponseDto>(result, {
      total: response.hits.total['value'],
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
    const context: any = {
      contentSearch,
      groupIds: filterGroupIds,
      limit,
      offset,
    };
    if (categoryIds) context.categoryIds = categoryIds;
    const payload = await this.getPayloadSearchForArticles(context);
    const response = await this.searchService.search<IPostElasticsearch>(payload);
    const hits = response.hits.hits;
    const articles = hits.map((item) => {
      const source: ArticleSearchResponseDto = {
        id: item._source.id,
        summary: item._source.summary.text,
        coverMedia: item._source.coverMedia,
        actor: item._source.actor,
        categories: item._source.categories,
        title: item._source.title?.text || null,
      };
      return source;
    });

    await this.postBindingService.bindActor(articles);

    const result = this.classTransformer.plainToInstance(ArticleSearchResponseDto, articles, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleSearchResponseDto>(result, {
      total: response.hits.total['value'],
      limit,
      offset,
    });
  }

  public async getPayloadSearchForPost(
    { startTime, endTime, contentSearch, actors, limit, offset, type }: SearchPostsDto,
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
          filter: [
            ...this._getActorFilter(actors),
            ...this._getTypeFilter(type),
            ...this._getAudienceFilter(groupIds),
            ...this._getFilterTime(startTime, endTime),
          ],
          should: [...this._getMatchKeyword(contentSearch)],
          // eslint-disable-next-line @typescript-eslint/naming-convention
          minimum_should_match: 1,
        },
      },
    };

    body['highlight'] = this._getHighlight();
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
          must: [...this._getMatchPrefixKeyword('title.text', contentSearch)],
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
    limit: number;
    offset: number;
  }): Promise<{
    index: string;
    body: any;
    from: number;
    size: number;
  }> {
    const { contentSearch, groupIds, categoryIds, limit, offset } = props;
    const body: BodyES = {
      query: {
        bool: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          filter: [...this._getTypeFilter(PostType.ARTICLE)],
        },
      },
    };
    if (contentSearch) {
      body.query.bool.should = [
        ...this._getMatchPrefixKeyword('title.text', contentSearch),
        ...this._getMatchPrefixKeyword('summary.text', contentSearch),
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
        'content.text': {
          ['matched_fields']: [content.text.default, content.text.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'summary.text': {
          ['matched_fields']: [summary.text.default, summary.text.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'title.text': {
          ['matched_fields']: [title.text.default, title.text.ascii],
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
    const { actor } = ELASTIC_POST_MAPPING_PATH;
    if (actors && actors.length) {
      return [
        {
          terms: {
            [actor.id]: actors,
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

  private _getAudienceFilter(groupIds: string[]): any {
    const { audience } = ELASTIC_POST_MAPPING_PATH;
    if (groupIds.length) {
      return [
        {
          terms: {
            [audience.groups.id]: groupIds,
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
            fields: [field.text.default, field.text.ascii],
            type: 'phrase', //Match pharse with high priority
          },
        },
        {
          match: {
            [field.text.default]: {
              query: keyword,
            },
          },
        },
        {
          match: {
            [field.text.ascii]: {
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
            fields: [field.text.default],
            type: 'phrase',
          },
        },
        {
          match: {
            [field.text.default]: {
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
