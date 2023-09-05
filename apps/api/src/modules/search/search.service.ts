import { SentryService } from '@app/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { FailedProcessPostModel } from '../../database/models/failed-process-post.model';
import { ELASTIC_POST_MAPPING_PATH } from '../../common/constants/elasticsearch.constant';
import { ElasticsearchHelper, StringHelper } from '../../common/helpers';
import { BodyES } from '../../common/interfaces/body-ealsticsearch.interface';
import { IPost, PostType } from '../../database/models/post.model';
import { PostBindingService } from '../post/post-binding.service';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import {
  IDataPostToAdd,
  IDataPostToDelete,
  IDataPostToUpdate,
} from './interfaces/post-elasticsearch.interface';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../v2-user/application';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../v2-group/application';
import { TagService } from '../tag/tag.service';
import { RULES } from '../v2-post/constant';
import { IPaginationSearchResult, IPostSearchQuery, ISearchPaginationQuery } from './interfaces';
import { QueryDslQueryContainer, SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';

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
    private readonly _failedProcessingPostModel: typeof FailedProcessPostModel
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

  public async updateSeriesAtrributeForPostSearch(ids: string[]): Promise<void> {
    const posts = await this.postService.getPostsWithSeries(ids);
    for (const post of posts) {
      await this.updateAttributePostToSearch(post, {
        seriesIds: post.postSeries.map((series) => series.seriesId),
      });
    }
  }

  public async searchContents<T>(
    query: IPostSearchQuery & ISearchPaginationQuery
  ): Promise<IPaginationSearchResult<T>> {
    const { from, size } = query;
    const body = this._getPayloadSearchForContent(query);
    const payload = {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      ...body,
      from,
      size,
    };
    const response = await this.elasticsearchService.search<T>(payload);

    if (!response || !response?.hits) {
      return;
    }

    return {
      total: (response.hits?.total as SearchTotalHits)?.value || 0,
      source: (response.hits?.hits || []).map((item) => ({
        ...item._source,
        highlight: item?.highlight,
      })),
      scrollId: response?._scroll_id,
    };
  }

  private _getHighlight(): any {
    const { content, summary, title } = ELASTIC_POST_MAPPING_PATH;
    return {
      ['pre_tags']: ['=='],
      ['post_tags']: ['=='],
      fields: {
        content: {
          ['matched_fields']: [content.default, content.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        summary: {
          ['matched_fields']: [summary.default, summary.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
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
    if (actors && actors?.length) {
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
    if (ids && ids?.length) {
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

  private _getCategoryFilter(categoryIds: string[]): any {
    const { categories } = ELASTIC_POST_MAPPING_PATH;
    if (categoryIds && categoryIds?.length) {
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
    if (filterGroupIds && filterGroupIds?.length) {
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
    if (filterItemIds && filterItemIds?.length) {
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

  private _getSort(textSearch: string): any {
    if (textSearch) {
      return [{ ['_score']: 'desc' }, { createdAt: 'desc' }];
    } else {
      return [{ createdAt: 'desc' }];
    }
  }

  private _getMatchQueryFromKeyword(keyword: string): QueryDslQueryContainer[] {
    if (!keyword) return [];
    let fields: string[];
    const { title, summary, content } = ELASTIC_POST_MAPPING_PATH;
    const isASCII = StringHelper.isASCII(keyword);
    if (isASCII) {
      fields = [
        title.ascii,
        title.default,
        summary.ascii,
        summary.default,
        content.ascii,
        content.default,
      ];
    } else {
      fields = [title.default, summary.default, content.default];
    }
    return [
      {
        multi_match: {
          query: keyword,
          fields,
        },
      },
    ];
  }

  private _getContentTypesFilter(postTypes: PostType[]): any {
    const { type } = ELASTIC_POST_MAPPING_PATH;
    if (postTypes && postTypes?.length) {
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
    if (tagIds && tagIds?.length) {
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

  private _getPayloadSearchForContent(query: IPostSearchQuery): BodyES {
    const {
      startTime,
      endTime,
      keyword,
      contentTypes,
      itemIds,
      actors,
      tags,
      topics,
      excludeByIds,
      groupIds,
      islimitSeries,
      shouldHighligh,
    } = query;
    const body: BodyES = {
      query: {
        bool: {
          must: [],
          must_not: [...this._getNotIncludeIds(excludeByIds)],
          filter: [
            ...this._getActorFilter(actors),
            ...this._getContentTypesFilter(contentTypes),
            ...this._getAudienceFilter(groupIds),
            ...this._getFilterTime(startTime, endTime),
            ...this._getItemInSeriesFilter(itemIds),
            ...this._getTagIdsFilter(tags),
            ...this._getCategoryFilter(topics),
            ...(islimitSeries ? this._limitSeriesFilter() : []),
          ],
          should: [...this._getMatchQueryFromKeyword(keyword)],
          minimum_should_match: keyword ? 1 : 0,
        },
      },
    };

    if (keyword && shouldHighligh) {
      body['highlight'] = this._getHighlight();
    }

    body['sort'] = [...this._getSort(keyword)];

    return body;
  }
}
