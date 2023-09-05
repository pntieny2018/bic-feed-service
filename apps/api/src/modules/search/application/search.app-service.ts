import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PageDto } from '../../../common/dto';
import { TagService } from '../../tag/tag.service';
import { UserDto } from '../../v2-user/application';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../v2-group/application';
import { SearchService } from '../search.service';
import { IPostElasticsearch } from '../interfaces';
import { ArticleDto, PostDto, SeriesDto } from '../../v2-post/application/dto';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../v2-post/domain/domain-service/interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../v2-post/application/binding/binding-post/content.interface';
import { PostType } from '../../v2-post/data-type';
import { SearchPostsDto } from '../../post/dto/requests';

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
    private readonly _contentBinding: IContentBinding
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

    const notIncludeIds = await this._contentDomainService.getReportedContentIdsByUser(
      authUser.id,
      [PostType.POST]
    );

    const response = await this._searchService.searchContents<IPostElasticsearch>({
      keyword: contentSearch,
      actors,
      contentTypes: type ? [type] : [],
      groupIds,
      startTime,
      endTime,
      excludeByIds: notIncludeIds,
      tags: tagId ? [tagId] : [],
      from: offset,
      size: limit,
      shouldHighligh: true,
    });
    const { source, total } = response;

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids: source.map((item) => item.id),
      authUser,
    });

    const result = await this._contentBinding.contentsBinding(contentEntities, authUser);

    return new PageDto<ArticleDto | PostDto | SeriesDto>(result, {
      total,
      limit,
      offset,
    });
  }
}
