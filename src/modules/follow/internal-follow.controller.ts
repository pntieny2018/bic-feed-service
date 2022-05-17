import { Body, Controller, Delete, Logger, Post } from '@nestjs/common';
import { FollowService } from './follow.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { APP_VERSION, KAFKA_TOPIC } from '../../common/constants';
import { CreateFollowDto, UnfollowDto } from './dto/requests';
import { ApiTags } from '@nestjs/swagger';

// @Controller()
@ApiTags('Follow')
@Controller({
  version: APP_VERSION,
  path: 'follows',
})
export class InternalFollowController {
  private _logger = new Logger(InternalFollowController.name);
  public constructor(private _followService: FollowService) {}

  // @EventPattern(EVENTS.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(@Payload('value') createFollowDto: CreateFollowDto): Promise<void> {
    this._logger.debug(`[follow]: ${JSON.stringify(createFollowDto)}`);
    await this._followService.follow(createFollowDto);
  }

  // @EventPattern(EVENTS.BEIN_GROUP.USERS_UNFOLLOW_GROUP)
  // public async unfollow(@Payload('value') unfollowDto: UnfollowDto): Promise<void> {
  @Delete('/')
  public async unfollow(@Body() unfollowDto: UnfollowDto): Promise<void> {
    this._logger.debug(`[unfollow]: ${JSON.stringify(unfollowDto)}`);
    await this._followService.unfollow(unfollowDto);
  }
}
