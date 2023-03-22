import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { PageDto } from '../../common/dto';
import { AuthUser } from '../auth';
import { SearchPostsDto } from './dto/requests';
import { SearchService } from './search.service';
import { UserDto } from '../v2-user/application';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: APP_VERSION,
  path: 'posts',
})
export class SearchController {
  public constructor(private _postAppService: SearchService) {}

  @ApiOperation({ summary: 'Search posts' })
  @Get('/')
  public searchPosts(
    @AuthUser() user: UserDto,
    @Query() searchPostsDto: SearchPostsDto
  ): Promise<PageDto<any>> {
    return this._postAppService.searchPosts(user, searchPostsDto);
  }
}
