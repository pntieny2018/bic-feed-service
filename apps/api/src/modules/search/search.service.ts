import { ArticleEntity, PostEntity } from '@api/modules/v2-post/domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '@api/modules/v2-post/domain/repositoty-interface';
import { CONTENT_TYPE } from '@beincom/constants';
import { SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';
import { StringHelper } from '@libs/common/helpers';
import { FailedProcessPostModel, PostAttributes } from '@libs/database/postgres/model';
import { SentryService } from '@libs/infra/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectModel } from '@nestjs/sequelize';

import { ElasticsearchHelper } from '../../common/helpers';

import { ElasticsearchQueryBuilder } from './elasticsearch-query.builder';
import {
  IPaginationSearchResult,
  IPostSearchQuery,
  ISearchPaginationQuery,
  IDataPostToAdd,
  IDataPostToDelete,
  IDataPostToUpdate,
  ICountContentsInCommunityQuery,
  ICountContentsInCommunityResult,
} from './interfaces';

@Injectable()
export class SearchService {
  /**
   * Logger
   * @protected
   */
  protected logger = new Logger(SearchService.name);

  public constructor(
    protected readonly sentryService: SentryService,
    protected readonly elasticsearchService: ElasticsearchService,
    protected readonly elasticsearchQueryBuilder: ElasticsearchQueryBuilder,
    @InjectModel(FailedProcessPostModel)
    private readonly _failedProcessingPostModel: typeof FailedProcessPostModel,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async addPostsToSearch(
    posts: IDataPostToAdd[],
    defaultIndex?: string
  ): Promise<{ totalCreated: number; totalUpdated: number }> {
    const index = defaultIndex ? defaultIndex : ElasticsearchHelper.ALIAS.POST.default.name;
    const body = [];
    for (const post of posts) {
      if (post.isHidden === true) {
        continue;
      }
      if (post.type === CONTENT_TYPE.ARTICLE) {
        post.content = StringHelper.serializeEditorContentToText(post.content);
      }
      if (post.type === CONTENT_TYPE.POST) {
        post.content =
          !post.content || StringHelper.containsOnlySpace(post.content)
            ? undefined
            : StringHelper.removeMarkdownCharacter(post.content);
      }
      body.push({ index: { _index: index, _id: post.id } });
      body.push(post);
    }
    if (body.length === 0) {
      return { totalUpdated: 0, totalCreated: 0 };
    }
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
        if (item.index.result === 'created') {
          totalCreated++;
        }
        if (item.index.result === 'updated') {
          totalUpdated++;
        }
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
      await this._contentRepo.updateContentLang(item.ids, item.lang);
    }
  }

  public async updatePostsToSearch(posts: IDataPostToUpdate[]): Promise<void> {
    const index = ElasticsearchHelper.ALIAS.POST.default.name;
    for (const dataIndex of posts) {
      if (dataIndex.isHidden === true) {
        continue;
      }
      if (dataIndex.type === CONTENT_TYPE.ARTICLE) {
        dataIndex.content = StringHelper.serializeEditorContentToText(dataIndex.content);
      }
      if (dataIndex.type === CONTENT_TYPE.POST) {
        dataIndex.content =
          !dataIndex.content || StringHelper.containsOnlySpace(dataIndex.content)
            ? undefined
            : StringHelper.removeMarkdownCharacter(dataIndex.content);
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
          await this._contentRepo.updateContentLang([dataIndex.id], newLang);
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

  /**
   * TODO refactor soon parameters
   * @parms post (id, lang)
   * */
  public async updateAttributePostToSearch(
    post: { id: string; lang?: string },
    dataUpdate: unknown
  ): Promise<void> {
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

  public async updateAttributePostsToSearch(
    posts: PostAttributes[],
    dataUpdate: unknown
  ): Promise<void> {
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
    if (updateOps.length === 0) {
      return;
    }
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

  public async updateAttachedSeriesForPost(ids: string[]): Promise<void> {
    const posts = await this._contentRepo.findAll({
      include: {
        shouldIncludeSeries: true,
      },
      where: {
        ids,
      },
    });
    for (const post of posts) {
      const seriesIds = (post as PostEntity | ArticleEntity).getSeriesIds();

      await this.updateAttributePostToSearch(
        { id: post.getId(), lang: post.getLang() },
        {
          seriesIds,
        }
      );
    }
  }

  public async searchContents<T>(
    query: IPostSearchQuery & ISearchPaginationQuery
  ): Promise<IPaginationSearchResult<T>> {
    const { from, size, searchAfter } = query;
    const body = this.elasticsearchQueryBuilder.buildPayloadSearchForContent(query);
    const payload = {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      ...body,
      from,
      size,
      search_after: searchAfter,
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
      cursor:
        response.hits?.hits && response.hits?.hits[response.hits?.hits.length - 1]
          ? response.hits?.hits[response.hits?.hits.length - 1].sort
          : null,
    };
  }

  public async countContentsInCommunity(
    query: ICountContentsInCommunityQuery
  ): Promise<ICountContentsInCommunityResult> {
    const { startTime, endTime, rootGroupIds } = query;
    const body = this.elasticsearchQueryBuilder.buildPayloadCountContentsInCommunity({
      startTime,
      endTime,
      rootGroupIds,
    });
    const aggs = {
      communities: {
        terms: {
          field: 'communityIds',
        },
      },
    };

    const payload = {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      ...body,
      aggs,
      size: 0, // return only aggregation results
    };

    const response = await this.elasticsearchService.search(payload);

    if (!response) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return response.aggregations.communities.buckets;
  }
}
