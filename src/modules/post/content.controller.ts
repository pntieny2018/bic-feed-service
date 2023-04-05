import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { AuthUser } from '../auth';
import { PostAppService } from './application/post.app-service';
import { UserDto } from '../v2-user/application';
import { GetAudienceContentDto } from './dto/requests/get-audience-content.response.dto';

@ApiSecurity('authorization')
@ApiTags('Content')
@Controller({
  version: APP_VERSION,
  path: 'content',
})
export class ContentController {
  public constructor(private _postAppService: PostAppService) {}

  @ApiOperation({ summary: 'Save post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Get('/:postId/audience')
  public async save(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() getAudienceContentDto: GetAudienceContentDto
  ): Promise<boolean> {
    return this._postAppService.getAudience(postId, user, getAudienceContentDto);
  }
}
