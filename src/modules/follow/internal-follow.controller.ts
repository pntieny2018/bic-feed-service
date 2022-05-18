import { Body, Controller, Logger } from '@nestjs/common';
import { FollowService } from './follow.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../common/constants';
import { CreateFollowDto, UnfollowDto } from './dto/requests';

@Controller()
export class InternalFollowController {
  private _logger = new Logger(InternalFollowController.name);
  public constructor(private _followService: FollowService) {}

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(@Payload('value') createFollowDto: CreateFollowDto): Promise<void> {
    this._logger.debug(`[follow]: ${JSON.stringify(createFollowDto)}`);
    await this._followService.follow(createFollowDto);
  }

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.USERS_UNFOLLOW_GROUP)
  public async unfollow(@Body() unfollowDto: UnfollowDto): Promise<void> {
    this._logger.debug(`[unfollow]: ${JSON.stringify(unfollowDto)}`);
    await this._followService.unfollow(unfollowDto);
  }
}
