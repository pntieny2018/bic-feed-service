import { Controller, Get, Query } from '@nestjs/common';
import { FollowService } from './follow.service';
import { APP_VERSION } from '../../common/constants';
import { GetUserFollowsDto } from './dto/requests/get-user-follows.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Follow')
@Controller({
  version: APP_VERSION,
  path: 'follows',
})
export class FollowController {
  public constructor(private _followService: FollowService) {}

  @Get('/')
  public getUserFollows(@Query() getUserFollowsDto: GetUserFollowsDto): Promise<{
    userIds: string[];
    latestFollowId: string;
  }> {
    return this._followService.filterUserFollows(
      getUserFollowsDto.ignoreUserIds,
      getUserFollowsDto.groupIds,
      getUserFollowsDto.followId,
      getUserFollowsDto.limit
    );
  }
}
