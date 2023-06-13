import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { FollowService } from './follow.service';
import { VERSIONS_SUPPORTED } from '../../common/constants';
import { GetUserFollowsDto } from './dto/requests';
import { ApiTags } from '@nestjs/swagger';
import { FollowsDto } from './dto/response/follows.dto';

@ApiTags('Follow')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'follows',
})
export class FollowController {
  public constructor(private _followService: FollowService) {}

  @Get('/')
  public gets(@Query() getUserFollowsDto: GetUserFollowsDto): Promise<FollowsDto> {
    return this._followService.gets(
      getUserFollowsDto.ignoreUserIds,
      getUserFollowsDto.groupIds,
      getUserFollowsDto.oldGroupIds,
      getUserFollowsDto.followId,
      getUserFollowsDto.limit
    );
  }

  @Get('/get-follows-by-user/:id')
  public async getFollowByUser(@Param('id', ParseUUIDPipe) userId: string): Promise<string[]> {
    const groups = await this._followService.getFollowByUserId(userId);
    return groups.map((row) => row.groupId);
  }
}
