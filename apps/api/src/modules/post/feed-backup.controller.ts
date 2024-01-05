import { UserDto } from '@libs/service/user';
import { Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../common/constants';
import { AuthUser } from '../../common/decorators';

import { PostAppService } from './application/post.app-service';

@ApiSecurity('authorization')
@ApiTags('Feed old version')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'feeds',
})
export class FeedBackupController {
  public constructor(private _postAppService: PostAppService) {}

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
    await this._postAppService.markSeenPost(postId, user.id);
    return true;
  }
}
