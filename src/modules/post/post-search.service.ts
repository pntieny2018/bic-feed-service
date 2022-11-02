import { PageDto } from '../../common/dto';
import { SearchPostsDto } from './dto/requests';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
import { IPost, PostType } from '../../database/models/post.model';
import {
  IPostResponseElasticsearch,
  IPostElasticsearch,
} from './interfaces/post-response-elasticsearch.interface';
import { GroupService } from '../../shared/group';

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
      this.logger.debug(`[Add post to ES] ${JSON.stringify(res)}`);
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
      groupIds = this.groupService.getGroupIdAndChildIdsUserCanReadPost(group, authUser);
      if (groupIds.length === 0) {
        return new PageDto<ArticleResponseDto>([], {
          limit,
          offset,
          hasNextPage: false,
        });
      }
    }

    const payload = await this.getPayloadSearch(searchPostsDto, groupIds);
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

  public async getPayloadSearch(
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
    console.log('object', JSON.stringify(body, null, 4));
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
