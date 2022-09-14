import { Controller, Get, Query } from '@nestjs/common';
import { FollowService } from './follow.service';
import { APP_VERSION } from '../../common/constants';
import { GetUserFollowsDto } from './dto/requests';
import { ApiTags } from '@nestjs/swagger';
import { FollowsDto } from './dto/response/follows.dto';

@ApiTags('Follow')
@Controller({
  version: APP_VERSION,
  path: 'follows',
})
export class FollowController {
  public constructor(private _followService: FollowService) {}

  @Get('/')
  public gets(@Query() getUserFollowsDto: GetUserFollowsDto): Promise<FollowsDto> {
    return this._followService.gets(
      getUserFollowsDto.ignoreUserIds,
      getUserFollowsDto.groupIds,
      getUserFollowsDto.followId,
      getUserFollowsDto.limit
    );
  }
}
