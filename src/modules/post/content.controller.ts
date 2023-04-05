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

  @ApiOperation({ summary: 'Get audience post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Get('/:postId/audience')
  public async getAudience(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() getAudienceContentDto: GetAudienceContentDto
  ): Promise<boolean> {
    return this._postAppService.getAudience(postId, user, getAudienceContentDto);
  }

  @ApiOperation({ summary: 'Pin/unpin content' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Put('/:postId/pin')
  public async pinItem(
    @AuthUser() authUser: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() pinContentDto: PinContentDto
  ): Promise<void> {
    try {
      await this._postAppService.pinContent({
        postId,
        pinGroupIds: pinContentDto.pinGroupIds,
        unpinGroupIds: pinContentDto.unpinGroupIds,
        authUser,
      });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case AudienceNoBelongContentException:
          throw new BadRequestException(e);
        case ContentNoPinPermissionException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
