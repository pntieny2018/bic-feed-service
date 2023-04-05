import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Get audience post' })
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

  @ApiOperation({ summary: 'Pin content' })
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
