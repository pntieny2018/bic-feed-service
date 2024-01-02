import { UserDto } from '@libs/service/user';
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../common/constants';
import { AuthUser } from '../../common/decorators';
import { PageDto } from '../../common/dto';
import { ArticleResponseDto } from '../article/dto/responses';
import { PostResponseDto } from '../post/dto/responses';

import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';
import { FeedService } from './feed.service';

@ApiTags('Feeds')
@ApiSecurity('authorization')
@Controller({
  path: 'feeds',
  version: VERSIONS_SUPPORTED,
})
export class FeedController {
  public constructor(private readonly _feedService: FeedService) {}

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
  public async getPinnedList(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @AuthUser() user: UserDto
  ): Promise<ArticleResponseDto[]> {
    return this._feedService.getPinnedList(groupId, user);
  }
}
