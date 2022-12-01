import { SentryService } from '@app/sentry';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClassTransformer } from 'class-transformer';
import { MediaType } from 'express';
import { ELASTIC_POST_MAPPING_PATH } from '../../common/constants/elasticsearch.constant';
import { PageDto } from '../../common/dto';
import { ArrayHelper, ElasticsearchHelper, StringHelper } from '../../common/helpers';
import { BodyES } from '../../common/interfaces/body-ealsticsearch.interface';
import { IPost, PostType } from '../../database/models/post.model';
import { GroupService } from '../../shared/group';
import { SearchArticlesDto } from '../article/dto/requests';
import { ArticleResponseDto } from '../article/dto/responses';
import { ArticleSearchResponseDto } from '../article/dto/responses/article-search.response.dto';
import { SeriesSearchResponseDto } from '../article/dto/responses/series-search.response.dto';
import { UserDto } from '../auth';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
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
    protected readonly groupService: GroupService
  ) {}

  public async addPostsToSearch(posts: IDataPostToAdd[], defaultIndex?: string): Promise<number> {
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
      if (res.errors === true) {
        const errorItems = res.items.filter((item) => item.index.error);
        console.log('errorItems', JSON.stringify(errorItems));
        this.logger.debug(`[ERROR index posts] ${errorItems}`);
      }
      await this._updateLangAfterIndexToES(res?.items || [], index);
      return res.items.filter((item) => !item.index.error).length;
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

  public async updatePostsToSearch(posts: IDataPostToUpdate[]): Promise<void> {
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

    const payload = await this.getPayloadSearchForPost(searchPostsDto, groupIds);
    const response = await this.searchService.search<IPostElasticsearch>(payload);
    const hits = response.hits.hits;
    const articleIds = [];
    const posts = hits.map((item) => {
      if (item._source.articles && item._source.articles.length) {
        articleIds.push(...item._source.articles.map((article) => article.id));
      }
      const source: any = {
        id: item._source.id,
        groupIds: item._source.groupIds,
        type: item._source.type,
        media: item._source.media,
        content: item._source.content || null,
        title: item._source.title || null,
        summary: item._source.summary || null,
        mentions: item._source.mentions,
        createdAt: item._source.createdAt,
        createdBy: item._source.createdBy,
        coverMedia: item._source.coverMedia ?? null,
        categories: item._source.categories,
        articles: item._source.articles,
      };
      if (contentSearch && item.highlight && item.highlight['content']?.length && source.content) {
        source.highlight = item.highlight['content'][0];
      }

      if (contentSearch && item.highlight && item.highlight['title']?.length && source.title) {
        source.titleHighlight = item.highlight['title'][0];
      }

      if (contentSearch && item.highlight && item.highlight['summary']?.length && source.summary) {
        source.summaryHighlight = item.highlight['summary'][0];
      }
      return source;
    });

    await Promise.all([
       this.reactionService.bindToPosts(posts),
      // this.postBindingService.bindActor(posts),
      // this.postBindingService.bindAudience(posts),
      // this.postBindingService.bindAttributes(posts, [
      //   'content',
      //   'commentsCount',
      //   'totalUsersSeen',
      //   'setting',
      // ]),
    ]);
   // await this.postBindingService.bindCommunity(posts);

    const articles = await this.postService.getSimpleArticlessByIds(
      ArrayHelper.arrayUnique(articleIds)
    );

    // await this.postBindingService.bindRelatedData(articles, {
    //   shouldBindActor: true,
    // });

    console.log('articles=', JSON.stringify(articles, null, 4));
    for (const post of posts) {
      if(post.articles) {
      post.articles = post.articles.map((article) => {
        const findArticle = articles.find((item) => item.id === article.id)
        return {
          ...article,
          ...findArticle
        }
      })
    }

    // const result = this.classTransformer.plainToInstance(ArticleResponseDto, posts, {
    //   excludeExtraneousValues: true,
    // });

    return new PageDto<any>(posts, {
      total: response.hits.total['value'],
      limit,
      offset,
    });
    }
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
        title: item._source.title?.text || null,
      };
      return source;
    });

    //await this.postBindingService.bindAudience(series);

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
      const source = {
        id: item._source.id,
        summary: item._source.summary.text,
        coverMedia: item._source.coverMedia,
        createdBy: item._source.createdBy,
        categories: item._source.categories,
        title: item._source.title?.text || null,
      };
      return source;
    });

    // await this.postBindingService.bindActor(articles);

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
          ['matched_fields']: [content.default, content.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'summary.text': {
          ['matched_fields']: [summary.default, summary.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'title.text': {
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
