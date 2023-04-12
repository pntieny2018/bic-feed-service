import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { AuthUser } from '../auth';
import { PostAppService } from './application/post.app-service';
import { UserDto } from '../v2-user/application';
import { GetAudienceContentDto } from './dto/requests/get-audience-content.response.dto';
import { PostResponseDto } from './dto/responses';
import { PinContentDto } from '../feed/dto/request/pin-content.dto';
import { ContentNotFoundException } from '../v2-post/exception/content-not-found.exception';
import { AudienceNoBelongContentException } from '../v2-post/exception/audience-no-belong-content.exception';
import { ContentNoPinPermissionException } from '../v2-post/exception/content-no-pin-permission.exception';
import { DomainModelException } from '../../common/exceptions/domain-model.exception';
import { ResponseMessages } from '../../common/decorators';

@ApiSecurity('authorization')
@ApiTags('Feed old version')
@Controller({
  version: APP_VERSION,
  path: 'feeds',
})
export class FeedBackupController {
  public constructor(private _postAppService: PostAppService) {}

  @ApiOperation({ summary: 'Save post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Post('/:postId/save')
  public async save(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.savePost(user, postId);
  }

  @ApiOperation({ summary: 'unsave post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Delete('/:postId/unsave')
  public async unSave(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.unSavePost(user, postId);
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
    await this._postAppService.markSeenPost(postId, user.id);
    return true;
  }
}
