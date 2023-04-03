import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { Controller, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PageDto } from '../../common/dto';
import { AuthUser } from '../auth';
import { GetTimelineDto } from './dto/request';
import { FeedService } from './feed.service';
import { PostResponseDto } from '../post/dto/responses';
import { APP_VERSION } from '../../common/constants';
import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';
import { UserDto } from '../v2-user/application';
import { GetDraftPostDto } from '../post/dto/requests/get-draft-posts.dto';
import { ArticleResponseDto } from '../article/dto/responses';

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
    @AuthUser(false) authUser: UserDto,
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
    name: 'id',
    description: 'Id of seen post',
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
  ): Promise<PageDto<UserDto>> {
    return this._feedService.getUsersSeenPosts(user, getUserSeenPostDto);
  }

  @ApiOperation({ summary: 'Get list pinned' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('group/:groupId/pinned')
  public getPinnedList(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @AuthUser() user: UserDto
  ): Promise<ArticleResponseDto[]> {
    return this._feedService.getPinnedList(groupId, user);
  }
}
