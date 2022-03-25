import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { MessageBody } from '@nestjs/websockets';
import { CreateFollowDto, UnfollowDto } from './dto/requests';
import { FollowService } from './follow.service';

@Controller()
export class FollowController {
  public constructor(private _followService: FollowService) {}
  @EventPattern('user_follow')
  public async follow(@MessageBody('value') createFollowDto: CreateFollowDto): Promise<void> {
    await this._followService.follow(createFollowDto);
  }

  @EventPattern('user_unfollow')
  public async unfollow(@MessageBody('value') unfollowDto: UnfollowDto): Promise<void> {
    await this._followService.unfollow(unfollowDto);
  }
}
