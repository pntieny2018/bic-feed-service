import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DEFAULT_APP_VERSION } from '../../common/constants';
import { GetTotalPostsInGroupDto } from './dto/requests';
import { TotalPostInGroupsDto } from './dto/responses';
import { InternalService } from './internal.service';

@ApiSecurity('authorization')
@ApiTags('Internal')
@Controller({
  path: 'internal',
  version: DEFAULT_APP_VERSION,
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
}
