import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { PostAppService } from './application/post.app-service';
import { SearchPostsDto } from './dto/requests';
import { PostResponseDto } from './dto/responses';
import { SearchService } from './search.service';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: APP_VERSION,
  path: 'posts',
})
export class SearchController {
  public constructor(private _postAppService: SearchService) {}

  @ApiOperation({ summary: 'Search posts' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/')
  public searchPosts(
    @AuthUser() user: UserDto,
    @Query() searchPostsDto: SearchPostsDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._postAppService.searchPosts(user, searchPostsDto);
  }
}
