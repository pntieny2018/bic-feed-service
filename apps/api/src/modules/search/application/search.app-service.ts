import { CONTENT_TARGET } from '@beincom/constants';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { PageDto } from '../../../common/dto';
import { SearchPostsDto } from '../../post/dto/requests';
import { TagService } from '../../tag/tag.service';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../v2-group/application';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../v2-post/application/binding/binding-post/content.interface';
import { ArticleDto, ContentHighlightDto, PostDto, SeriesDto } from '../../v2-post/application/dto';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../v2-post/domain/domain-service/interface';
import {
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../../v2-post/domain/repositoty-interface';
import { UserDto } from '../../v2-user/application';
import { IPostElasticsearch } from '../interfaces';
import { SearchService } from '../search.service';

@Injectable()
export class SearchAppService {
  public constructor(
    private _searchService: SearchService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private _groupAppService: IGroupApplicationService,
    private _tagService: TagService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository
  ) {}

  /*
    Search posts, articles, series
  */
  public async searchPosts(
    authUser: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<ArticleDto | PostDto | SeriesDto>> {
    const { contentSearch, type, actors, startTime, endTime, limit, offset, groupId, tagName } =
      searchPostsDto;
    if (!authUser || authUser.groups.length === 0) {
      return new PageDto([], {
        total: 0,
        limit,
        offset,
      });
    }

    let groupIds = authUser.groups;
    let tagId: string;
    if (groupId) {
      const group = await this._groupAppService.findOne(groupId);
      if (!group) {
        throw new BadRequestException(`Group not found`);
      }
      groupIds = this._groupAppService.getGroupIdAndChildIdsUserJoined(group, authUser.groups);
      if (groupIds.length === 0) {
        return new PageDto([], {
          limit,
          offset,
          hasNextPage: false,
        });
      }
      if (tagName) {
        tagId = await this._tagService.findTag(tagName, groupId);
        if (tagId) {
          searchPostsDto.tagId = tagId;
        }
      }
    }

    const notIncludeIds = await this._reportRepo.getReportedTargetIdsByReporterId({
      reporterId: authUser.id,
      groupIds,
      targetTypes: [CONTENT_TARGET.POST],
    });

    const response = await this._searchService.searchContents<IPostElasticsearch>({
      keyword: contentSearch,
      actors,
      contentTypes: type ? [type] : [],
      groupIds,
      startTime,
      endTime,
      excludeByIds: notIncludeIds,
      tagIds: tagId ? [tagId] : [],
      from: offset,
      size: limit,
      shouldHighlight: true,
    });
    const { source, total } = response;

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids: source.map((item) => item.id),
      authUserId: authUser.id,
    });

    let result = await this._contentBinding.contentsBinding(contentEntities, authUser);

    const sourceHasHightlight = source.filter((item) => item?.highlight);

    if (contentSearch && sourceHasHightlight.length) {
      const highlightMapper = this._buildHighlightMapper(sourceHasHightlight);
      result = this._bindingHighlight(result, highlightMapper);
    }

    return new PageDto<ArticleDto | PostDto | SeriesDto>(result, {
      total,
      limit,
      offset,
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
