import { Controller, Get, Query } from '@nestjs/common';
import { FollowService } from './follow.service';
import { MessageBody } from '@nestjs/websockets';
import { EventPattern } from '@nestjs/microservices';
import { APP_VERSION, EVENTS } from '../../common/constants';
import { CreateFollowDto, UnfollowDto } from './dto/requests';
import { GetUserFollowsDto } from './dto/requests/get-user-follows.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Follow')
@Controller({
  version: APP_VERSION,
  path: 'follows',
})
export class FollowController {
  public constructor(private _followService: FollowService) {}

  @EventPattern(EVENTS.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(@MessageBody('value') createFollowDto: CreateFollowDto): Promise<void> {
    await this._followService.follow(createFollowDto);
  }

  @EventPattern(EVENTS.BEIN_GROUP.USERS_UNFOLLOW_GROUP)
  public async unfollow(@MessageBody('value') unfollowDto: UnfollowDto): Promise<void> {
    await this._followService.unfollow(unfollowDto);
  }

  @Get('/')
  public getUserFollows(@Query() getUserFollowsDto: GetUserFollowsDto): Promise<{
    userIds: number[];
    latestFollowId: number;
  }> {
    return this._followService.getUniqueUserFollows(
      getUserFollowsDto.ignoreUserIds,
      getUserFollowsDto.groupIds,
      [],
      getUserFollowsDto.followId,
      getUserFollowsDto.limit
    );
  }
}
