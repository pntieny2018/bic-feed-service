import { Controller } from '@nestjs/common';
import { EVENTS } from '../../common/constants';
import { FollowService } from './follow.service';
import { MessageBody } from '@nestjs/websockets';
import { EventPattern } from '@nestjs/microservices';
import { CreateFollowDto, UnfollowDto } from './dto/requests';

@Controller()
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
}
