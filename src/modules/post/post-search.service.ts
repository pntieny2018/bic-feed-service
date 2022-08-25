import { PageDto } from '../../common/dto';
import { SearchPostsDto } from './dto/requests';
import { Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { PostResponseDto } from './dto/responses';
import { ClassTransformer } from 'class-transformer';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SentryService } from '@app/sentry';
import { ELASTIC_POST_MAPPING_PATH } from '../../common/constants/elasticsearch.constant';
import { PostService } from './post.service';
import { ElasticsearchHelper, StringHelper } from '../../common/helpers';
import { BodyES } from '../../common/interfaces/body-ealsticsearch.interface';

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
    protected readonly sentryService: SentryService
  ) {}

  /**
   * Get Draft Posts
   * @throws HttpException
   * @param authUser UserDto
   * @param searchPostsDto SearchPostsDto
   * @returns Promise resolve PageDto<PostResponseDto>
   */
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
    console.log('searchPostsDto=', searchPostsDto);
    const groupIds = user.groups;
    const payload = await this.getPayloadSearch(searchPostsDto, groupIds);
    console.log('payload=', JSON.stringify(payload, null, 4));
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
      this.postService.bindActorToPost(posts),
      this.postService.bindAudienceToPost(posts),
      this.postService.bindPostData(posts, {
        commentsCount: true,
        totalUsersSeen: true,
        importantExpiredAt: true,
        isImportant: true,
      }),
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
  /**
   *
   * @param SearchPostsDto
   * @param groupIds
   * @returns
   */
  public async getPayloadSearch(
    { startTime, endTime, contentSearch, actors, important, limit, offset }: SearchPostsDto,
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
    this._applyImportantFilter(important, body);

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
  private _applyFilterContent(textSearch: string, body: BodyES): void {
    if (textSearch) {
      const arrKeywords = textSearch.split(' ');
      const isASCII = arrKeywords.every((i) => StringHelper.isASCII(i));
      const queries = this._getQueryMatchContent(isASCII);
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
    body['highlight'] = {
      ['pre_tags']: ['=='],
      ['post_tags']: ['=='],
      fields: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'content.text': {
          ['matched_fields']: ['content.text.default', 'content.text.ascii'],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
      },
    };
  }
  private _getQueryMatchContent(isASCII: boolean): any[] {
    const { content } = ELASTIC_POST_MAPPING_PATH;
    let queries;
    if (isASCII) {
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: content,
            fields: [content.text.default, content.text.ascii],
            type: 'phrase',
            boost: 2,
          },
        },
        {
          match: {
            ['content.text.default']: {
              query: content,
            },
          },
        },
        {
          match: {
            ['content.text.ascii']: {
              query: content,
            },
          },
        },
      ];
    } else {
      queries = [
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          multi_match: {
            query: content,
            fields: [content.text.default],
            type: 'phrase',
            boost: 2,
          },
        },
        {
          match: {
            [content.text.default]: {
              query: content,
            },
          },
        },
      ];
    }

    return queries;
  }
}
