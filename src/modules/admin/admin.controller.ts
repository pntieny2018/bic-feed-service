import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { PageDto } from '../../common/dto';
import { PostResponseDto } from '../post/dto/responses';
import { GetsByAdminDto } from './dto/requests/gets-by-admin.dto';
import { AdminService } from './admin.service';
import { ArticleResponseDto } from '../article/dto/responses';
import { AuthUser } from '../auth';
import { GetPostPipe } from '../post/pipes';
import { GetArticleDto } from '../article/dto/requests';
import { UserDto } from '../v2-user/application';

@ApiSecurity('authorization')
@ApiTags('Admin')
@Controller({
  version: APP_VERSION,
  path: 'admin',
})
export class AdminController {
  public constructor(private _adminService: AdminService) {}

  @ApiOperation({ summary: 'Get posts by param' })
  @Get('/posts/params')
  public getPostsByParamsInGroups(
    @Query() getsByAdminDto: GetsByAdminDto,
    @AuthUser() user: UserDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._adminService.getPostsByParamsInGroups(getsByAdminDto, user);
  }

  @ApiOperation({ summary: 'Get post detail' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/posts/:id')
  public get(
    @Param('id', ParseUUIDPipe) articleId: string,
    @Query(GetPostPipe) getArticleDto: GetArticleDto,
    @AuthUser() user: UserDto
  ): Promise<any> {
    return this._adminService.getPostDetail(articleId, user);
  }
}
