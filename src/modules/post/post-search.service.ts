import { PageDto } from '../../common/dto';
import { SearchPostsDto } from './dto/requests';
import { Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { AudienceResponseDto, PostResponseDto } from './dto/responses';
import { ArticleResponseDto } from '../article/dto/responses';
import { ClassTransformer } from 'class-transformer';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SentryService } from '@app/sentry';
import { ELASTIC_POST_MAPPING_PATH } from '../../common/constants/elasticsearch.constant';
import { PostService } from './post.service';
import { ElasticsearchHelper, StringHelper } from '../../common/helpers';
import { BodyES } from '../../common/interfaces/body-ealsticsearch.interface';
import { ReactionService } from '../reaction';
import { MediaFilterResponseDto } from '../media/dto/response';
import { UserMentionDto } from '../mention/dto';
import { PostSettingDto } from './dto/common/post-setting.dto';
import { UserSharedDto } from '../../shared/user/dto';
import { PostBindingService } from './post-binding.service';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { IPost } from '../../database/models/post.model';

export type DataPostToAdd = {
  id: string;
  commentsCount: number;
  totalUsersSeen: number;
  content: string;
  media: MediaFilterResponseDto;
  mentions: UserMentionDto;
  audience: AudienceResponseDto;
  setting: PostSettingDto;
  createdAt: Date;
  actor: UserSharedDto;
  isArticle: boolean;
  title?: string;
  summary?: string;
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
    protected readonly linkPreviewService: LinkPreviewService
  ) {}

  public async addPostsToSearch(posts: DataPostToAdd[], defaultIndex?: string): Promise<void> {
    const index = defaultIndex ? defaultIndex : ElasticsearchHelper.ALIAS.POST.default.name;
    const body = [];
    for (const post of posts) {
      if (post.isArticle) {
        post.content = StringHelper.serializeEditorContentToText(post.content);
      } else {
        post.content = StringHelper.removeMarkdownCharacter(post.content);
      }
      // eslint-disable-next-line @typescript-eslint/naming-convention
      body.push({ index: { _index: index, _id: post.id } });
      body.push(post);
    }
    try {
      const res = await this.elasticsearchService.bulk({
        refresh: true,
        body,
        pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
      });
      if (res.errors === true) {
        console.log('Has errors:', JSON.stringify(res.items, null, 4));
      }
      await this._updateLangAfterIndexToES(res?.items || [], index);
    } catch (e) {
      this.logger.debug('111', e);
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
      if (dataIndex.isArticle) {
        dataIndex.content = StringHelper.serializeEditorContentToText(dataIndex.content);
      } else {
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
        this.logger.debug(e);
        this.sentryService.captureException(e);
      });
    }
  }

  /*
    Search posts and articles
  */
  public async searchPosts(
    authUser: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { contentSearch, limit, offset } = searchPostsDto;
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<ArticleResponseDto>([], {
        total: 0,
        limit,
        offset,
      });
    }
    const groupIds = user.groups;
    const payload = await this.getPayloadSearch(searchPostsDto, groupIds);
    const response = await this.searchService.search<ArticleResponseDto>(payload);
    const hits = response.hits.hits;
    const posts = hits.map((item) => {
      const source = item._source;
      console.log('object', JSON.stringify(item, null, 4));
      source.content = item._source.content['text'];
      source['id'] = item._id;
      if (
        contentSearch &&
        item.highlight &&
        item.highlight['content.text']?.length &&
        source.content
      ) {
        source.highlight = item.highlight['content.text'][0];
      }

      if (contentSearch && item.highlight && item.highlight['title.text']?.length && source.title) {
        console.log('ddddddddddddd');
        source['titleHighlight'] = item.highlight['title.text'][0];
      }

      if (
        contentSearch &&
        item.highlight &&
        item.highlight['summary.text']?.length &&
        source.summary
      ) {
        source['summaryHighlight'] = item.highlight['summary.text'][0];
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

  public async getPayloadSearch(
    { startTime, endTime, contentSearch, actors, limit, offset }: SearchPostsDto,
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
          filter: [],
          should: [],
        },
      },
    };

    this._applyActorFilter(actors, body);

    //this._applyAudienceFilter(groupIds, body);

    this._applyFilterKeyword(contentSearch, body);
    this._applySort(contentSearch, body);
    this._applyFilterTime(startTime, endTime, body);
    console.log('object', JSON.stringify(body, null, 4));
    return {
      index: ElasticsearchHelper.ALIAS.POST.all.name,
      body,
      from: offset,
      size: limit,
    };
  }

  private _applyFilterTime(startTime: string, endTime: string, body: BodyES): void {
    if (startTime || endTime) {
      const filterTime = {
        range: {
          createdAt: {},
        },
      };

      if (startTime) filterTime.range.createdAt['gte'] = startTime;
      if (endTime) filterTime.range.createdAt['lte'] = endTime;
      body.query.bool.must.push(filterTime);
    }
  }

  private _applyActorFilter(actors: string[], body: BodyES): void {
    const { actor } = ELASTIC_POST_MAPPING_PATH;
    if (actors && actors.length) {
      body.query.bool.filter.push({
        terms: {
          [actor.id]: actors,
        },
      });
    }
  }
  private _applyAudienceFilter(groupIds: string[], body: BodyES): void {
    const { audience } = ELASTIC_POST_MAPPING_PATH;
    if (groupIds.length) {
      body.query.bool.filter.push({
        terms: {
          [audience.groups.id]: groupIds,
        },
      });
    }
  }

  private _applyImportantFilter(important: boolean, body: BodyES): void {
    const { setting } = ELASTIC_POST_MAPPING_PATH;
    if (important) {
      body.query.bool.must.push({
        term: {
          [setting.isImportant]: true,
        },
      });
      body.query.bool.must.push({
        range: {
          [setting.importantExpiredAt]: { gt: new Date().toISOString() },
        },
      });
    }
  }
  private _applyFilterKeyword(keyword: string, body: BodyES): void {
    if (keyword) {
      const { content, title, summary } = ELASTIC_POST_MAPPING_PATH;
      const queryContent = this._getQueryMatchKeyword(content, keyword);
      const queryTitle = this._getQueryMatchKeyword(title, keyword);
      const querySummary = this._getQueryMatchKeyword(summary, keyword);
      body.query.bool.should.push({
        ['dis_max']: { queries: [...queryContent, ...querySummary, ...queryTitle] },
      });
      body.query.bool['minimum_should_match'] = 1;
      this._bindHighlight(body);
    }
  }

  private _applySort(textSearch: string, body: BodyES): void {
    if (textSearch) {
      body['sort'] = [{ ['_score']: 'desc' }, { createdAt: 'desc' }];
    } else {
      body['sort'] = [{ createdAt: 'desc' }];
    }
  }

  private _bindHighlight(body: BodyES): void {
    const { content, summary, title } = ELASTIC_POST_MAPPING_PATH;
    body['highlight'] = {
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
            boost: 2,
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
            boost: 2,
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
