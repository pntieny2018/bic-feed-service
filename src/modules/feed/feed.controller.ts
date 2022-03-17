import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, InjectAuthUserToQuery, UserDto } from '../auth';
import { GetTimelineDto } from './dto/request';
import { FeedDto } from './dto/response';
import { FeedService } from './feed.service';

@ApiTags('Feeds')
@ApiSecurity('authorization')
@Controller('feeds')
export class FeedController {
  public constructor(private readonly _feedService: FeedService) {}

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: FeedDto,
  })
  @InjectAuthUserToQuery()
  @Get('/timeline')
  public async getTimeline(
    @AuthUser() userDto: UserDto,
    @Query() getTimelineDto: GetTimelineDto
  ): Promise<FeedDto> {
    return this._feedService.getTimeline(userDto, getTimelineDto);
  }
}
