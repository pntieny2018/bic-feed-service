import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { Controller, Get, Param, ParseArrayPipe, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { GetTimelineDto } from './dto/request';
import { FeedService } from './feed.service';
import { PostResponseDto } from '../post/dto/responses';
import { APP_VERSION } from '../../common/constants';
import { PutMarkSeenPostDto } from './dto/request/put-mark-seen-post.dto';
import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';
import { UserDataShareDto } from '../../shared/user/dto';

@ApiTags('Feeds')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'feeds',
})
export class FeedController {
  public constructor(private readonly _feedService: FeedService) {}

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get('/timeline')
  public async getTimeline(
    @AuthUser() authUser: UserDto,
    @Query() getTimelineDto: GetTimelineDto
  ): Promise<any> {
    return this._feedService.getTimeline(authUser, getTimelineDto);
  }

  @ApiOperation({ summary: 'Get newsfeed of user' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get('/newsfeed')
  public async getNewsFeed(
    @AuthUser() authUser: UserDto,
    @Query() getNewsFeedDto: GetNewsFeedDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._feedService.getNewsFeed(authUser, getNewsFeedDto);
  }

  @ApiOperation({ summary: 'Mark seen post' })
  @ApiParam({
    name: 'ids',
    description: 'Ids of seen post',
    example: '400,401,402',
    required: true,
  })
  @ApiOkResponse({
    type: Boolean,
  })
  @Put('/seen/:id')
  public async markSeenPost(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    await this._feedService.markSeenPosts(postId, user.id);
    return true;
  }

  @ApiOperation({ summary: 'Get users seen post' })
  @Get('/seen/user')
  public async getUserSeenPost(
    @AuthUser() user: UserDto,
    @Query() getUserSeenPostDto: GetUserSeenPostDto
  ): Promise<PageDto<UserDataShareDto>> {
    return this._feedService.getUsersSeenPots(user, getUserSeenPostDto);
  }
}
