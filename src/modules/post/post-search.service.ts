import { PageDto } from '../../common/dto';
import { SearchPostsDto } from './dto/requests';
import { Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { AudienceResponseDto, PostResponseDto } from './dto/responses';
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
};
type DataPostToUpdate = DataPostToAdd & {
  lang: string;
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

  public async addPostsToSearch(posts: DataPostToAdd[]): Promise<void> {
    const index = ElasticsearchHelper.ALIAS.POST.default.name;
    for (const dataIndex of posts) {
      dataIndex.content = StringHelper.removeMarkdownCharacter(dataIndex.content);
      this.elasticsearchService
        .index({
          index,
          id: dataIndex.id,
          body: dataIndex,
          pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
        })
        .then((res) => {
          const lang = ElasticsearchHelper.getLangOfPostByIndexName(res.body._index);
          this.postService.updateData([dataIndex.id], { lang });
        })
        .catch((e) => {
          this.logger.debug(e);
          this.sentryService.captureException(e);
        });
    }
  }

  public async updatePostsToSearch(posts: DataPostToUpdate[]): Promise<void> {
    const index = ElasticsearchHelper.ALIAS.POST.default.name;
    for (const dataIndex of posts) {
      dataIndex.content = StringHelper.removeMarkdownCharacter(dataIndex.content);
      this.elasticsearchService
        .index({
          index,
          id: dataIndex.id,
          body: dataIndex,
          pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
        })
        .then((res) => {
          const newLang = ElasticsearchHelper.getLangOfPostByIndexName(res.body._index);
          if (dataIndex.lang !== newLang) {
            this.postService.updateData([dataIndex.id], { lang: newLang });
            const oldIndex = ElasticsearchHelper.getIndexOfPostByLang(dataIndex.lang);
            this.elasticsearchService
              .delete({ index: oldIndex, id: `${dataIndex.id}` })
              .catch((e) => {
                this.logger.debug(e);
                this.sentryService.captureException(e);
              });
          }
        })
        .catch((e) => {
          this.logger.debug(e);
          this.sentryService.captureException(e);
        });
    }
  }
  public async deletePostsToSearch(ids: string[]): Promise<void> {
    const index = ElasticsearchHelper.ALIAS.POST.all.name;
    for (const id of ids) {
      this.elasticsearchService.delete({ index, id }).catch((e) => {
        this.logger.debug(e);
        this.sentryService.captureException(e);
      });
    }
  }

  public async searchPosts(
    authUser: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<PostResponseDto>> {
    const { contentSearch, limit, offset } = searchPostsDto;
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<PostResponseDto>([], {
        total: 0,
        limit,
        offset,
      });
    }
    const groupIds = user.groups;
    const payload = await this.getPayloadSearch(searchPostsDto, groupIds);
    const response = await this.searchService.search(payload);
    const hits = response.body.hits.hits;
    const posts = hits.map((item) => {
      const source = item._source;
      source.content = item._source.content.text;
      source['id'] = item._id;
      if (
        contentSearch &&
        item.highlight &&
        item.highlight['content.text'].length != 0 &&
        source.content
      ) {
        source.highlight = item.highlight['content.text'][0];
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

    const result = this.classTransformer.plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      total: response.body.hits.total.value,
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

    this._applyAudienceFilter(groupIds, body);

    this._applyFilterContent(contentSearch, body);
    this._applySort(contentSearch, body);
    this._applyFilterTime(startTime, endTime, body);
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
  private _applyFilterContent(contentSearch: string, body: BodyES): void {
    if (contentSearch) {
      const queries = this._getQueryMatchContent(contentSearch);
      body.query.bool.should.push({
        ['dis_max']: { queries },
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
    const { content } = ELASTIC_POST_MAPPING_PATH;
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
      },
    };
  }
  private _getQueryMatchContent(contentSearch: string): any[] {
    const { content } = ELASTIC_POST_MAPPING_PATH;
    let queries;
    const isASCII = this._isASCIIKeyword(contentSearch);
    if (isASCII) {
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: contentSearch,
            fields: [content.text.default, content.text.ascii],
            type: 'phrase', //Match pharse with heigh priority
            boost: 2,
          },
        },
        {
          match: {
            [content.text.default]: {
              query: contentSearch,
            },
          },
        },
        {
          match: {
            [content.text.ascii]: {
              query: contentSearch,
            },
          },
        },
      ];
    } else {
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: contentSearch,
            fields: [content.text.default],
            type: 'phrase',
            boost: 2,
          },
        },
        {
          match: {
            [content.text.default]: {
              query: contentSearch,
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
