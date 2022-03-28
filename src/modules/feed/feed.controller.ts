import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { GetTimelineDto } from './dto/request';
import { FeedPostDto } from './dto/response';
import { FeedService } from './feed.service';

@ApiTags('Feeds')
@ApiSecurity('authorization')
@Controller('feeds')
export class FeedController {
  public constructor(private readonly _feedService: FeedService) {}

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get('/timeline')
  public async getTimeline(
    @AuthUser() userDto: UserDto,
    @Query() getTimelineDto: GetTimelineDto
  ): Promise<PageDto<FeedPostDto>> {
    return this._feedService.getTimeline(userDto, getTimelineDto);
  }

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get('/newsfeed')
  public async getNewsFeed(
    @AuthUser() userDto: UserDto,
    @Query() getTimelineDto: GetTimelineDto
  ): Promise<PageDto<FeedPostDto>> {
    return this._feedService.getTimeline(userDto, getTimelineDto);
  }
}
