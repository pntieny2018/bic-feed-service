import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { GetTotalPostsInGroupDto } from './dto/requests';
import { TotalPostInGroupsDto } from './dto/responses';
import { InternalService } from './internal.service';
import { GetPostsByParamsInGroupsDto } from './dto/requests/get-posts-by-params-in-groups.dto';

@ApiSecurity('authorization')
@ApiTags('Internal')
@Controller({
  path: 'internal',
  version: APP_VERSION,
})
export class InternalController {
  public constructor(private _internalService: InternalService) {}

  @ApiOperation({ summary: 'Get total post in groups' })
  @Get('/get-total-posts-in-groups')
  public getRecentSearches(
    @Query() getTotalPostsInGroupDto: GetTotalPostsInGroupDto
  ): Promise<TotalPostInGroupsDto[]> {
    const { groupIds } = getTotalPostsInGroupDto;
    return this._internalService.getTotalPostByGroupIds(groupIds);
  }

  @ApiOperation({ summary: 'Get total post in groups' })
  @Get('/get-posts-in-groups')
  public getPostsByParamsInGroups(
    @Query() getTotalPostsInGroupDto: GetPostsByParamsInGroupsDto
  ): Promise<TotalPostInGroupsDto[]> {
    const { status, groupIds } = getTotalPostsInGroupDto;
    return this._internalService.getPostsByParamsByGroupsIds(groupIds, status);
  }
}
