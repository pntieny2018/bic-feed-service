import { SearchPostsDto } from '@api/modules/search/application/dto/search-post.dto';
import { UserDto } from '@libs/service/user';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../common/constants';
import { AuthUser } from '../../common/decorators';
import { PageDto } from '../../common/dto';

import { SearchAppService } from './application/search.app-service';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'posts',
})
export class SearchController {
  public constructor(private _searchAppService: SearchAppService) {}

  @ApiOperation({ summary: 'Search posts' })
  @Get('/')
  public searchPosts(
    @AuthUser() user: UserDto,
    @Query() searchPostsDto: SearchPostsDto
  ): Promise<PageDto<any>> {
    return this._searchAppService.searchPosts(user, searchPostsDto);
  }
}
