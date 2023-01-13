import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { PageDto } from '../../common/dto';
import { PostResponseDto } from '../post/dto/responses';
import { GetsByAdminDto } from './dto/requests/gets-by-admin.dto';
import { AdminService } from './admin.service';

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
    @Query() getsByAdminDto: GetsByAdminDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._adminService.getPostsByParamsInGroups(getsByAdminDto);
  }
}
