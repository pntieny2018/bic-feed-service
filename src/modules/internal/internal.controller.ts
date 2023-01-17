import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { GetTotalPostsInGroupDto } from './dto/requests';
import { TotalPostInGroupsDto } from './dto/responses';
import { InternalService } from './internal.service';

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

  // TODO move this to kafka
  @ApiOperation({ summary: 'Get total post in groups' })
  @Post('/archiveGroup/:id')
  public archiveGroup(@Param('id', ParseUUIDPipe) ids: string): Promise<boolean> {
    return this._internalService.archiveGroup([ids]);
  }
}
