import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchContentsQuery } from './search-contents.query';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { ELASTICSEARCH_DEFAULT_SIZE_PAGE, IPostElasticsearch } from '../../../../search';
import { SearchContentsDto } from './search-contents.dto';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { createCursor, parseCursor } from '../../../../../common/dto/cusor-pagination';
import { SearchService } from '../../../../search/search.service';
import { ArticleDto, ContentHighlightDto, PostDto, SeriesDto } from '../../dto';

@QueryHandler(SearchContentsQuery)
export class SearchContentsHandler
  implements IQueryHandler<SearchContentsQuery, SearchContentsDto>
{
  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(query: SearchContentsQuery): Promise<SearchContentsDto> {
    const {
      authUser,
      keyword,
      actors,
      startTime,
      endTime,
      tags,
      groupId,
      contentTypes,
      isIncludedInnerGroups = true,
      limit = ELASTICSEARCH_DEFAULT_SIZE_PAGE,
      after,
    } = query.payload;

    let groupIds: string[] = authUser.groups;
    if (groupId) {
      if (isIncludedInnerGroups) {
        const group = await this._groupAppService.findOne(groupId);
        groupIds = this._groupAppService.getGroupIdAndChildIdsUserJoined(group, authUser.groups);
      } else {
        groupIds = [groupId];
      }
    }

    const excludeByIds = await this._contentDomainService.getReportedContentIdsByUser(
      authUser.id,
      contentTypes
    );

    const response = await this._postSearchService.searchContents<IPostElasticsearch>({
      keyword,
      actors,
      contentTypes,
      groupIds,
      startTime,
      endTime,
      excludeByIds,
      tags,
      size: limit,
      searchAfter: after ? parseCursor(after) : undefined,
      shouldHighlight: true,
    });

    const { source, total, cursor } = response;

    if (!source || !source.length || !total) {
      return new SearchContentsDto([], {
        hasNextPage: false,
      });
    }

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids: source.map((item) => item.id),
      authUser,
    });

    let result = await this._contentBinding.contentsBinding(contentEntities, authUser);

    const sourceHasHightlight = source.filter((item) => item?.highlight);

    if (keyword && sourceHasHightlight.length) {
      const highlightMapper = this._buildHighlightMapper(sourceHasHightlight);
      result = this._bindingHighlight(result, highlightMapper);
    }

    return new SearchContentsDto(result, {
      total,
      hasNextPage: limit > source.length,
      endCursor: cursor ? createCursor(cursor) : '',
    });
  }

  private _buildHighlightMapper(source: IPostElasticsearch[]): Map<string, ContentHighlightDto> {
    const mapper = new Map<string, ContentHighlightDto>();

    source.forEach((item) => {
      const contentHighlight = new ContentHighlightDto();
      if (item.highlight['content']?.length) {
        contentHighlight.highlight = item.highlight['content'][0];
      }
      if (item.highlight['title']?.length) {
        contentHighlight.titleHighlight = item.highlight['title'][0];
      }
      if (item.highlight['summary']?.length) {
        contentHighlight.summaryHighlight = item.highlight['summary'][0];
      }
      mapper.set(item.id, contentHighlight);
    });

    return mapper;
  }

  private _bindingHighlight(
    contents: (ArticleDto | PostDto | SeriesDto)[],
    highlightMapper: Map<string, ContentHighlightDto>
  ): (ArticleDto | PostDto | SeriesDto)[] {
    contents.forEach((content) => {
      if (highlightMapper.has(content.id)) {
        const value = highlightMapper.get(content.id);
        content.highlight = value?.highlight;
        content.titleHighlight = value?.titleHighlight;
        content.summaryHighlight = value?.summaryHighlight;
      }
    });
    return contents;
  }
}
