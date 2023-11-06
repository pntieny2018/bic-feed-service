import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../common/constants';
import { FollowDto } from './dto/requests';
import { FollowService } from './follow.service';

@Controller()
export class InternalFollowController {
  private _logger = new Logger(InternalFollowController.name);

  public constructor(private _followService: FollowService) {}

  // @EventPattern(KAFKA_TOPIC.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(@Payload('value') payload: FollowDto): Promise<void> {
    this._logger.debug(`[Event follow/unfollow]: ${JSON.stringify(payload)}`);
    if (payload.verb === 'FOLLOW') {
      await this._followService.follow(payload);
    }

    if (payload.verb === 'UNFOLLOW') {
      await this._followService.unfollow(payload);
    }
  }
}
