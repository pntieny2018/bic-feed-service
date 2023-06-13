import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { DEFAULT_APP_VERSION, TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { MarkReadImportantContentCommand } from '../../application/command/mark-read-important-content/mark-read-important-content.command';
import { ValidateSeriesTagsCommand } from '../../application/command/validate-series-tags/validate-series-tag.command';
import { ValidateSeriesTagDto } from '../dto/request';
import { TagSeriesInvalidException } from '../../domain/exception/tag-series-invalid.exception';
import { ResponseMessages } from '../../../../common/decorators';
import { UpdatePostRequestDto } from '../dto/request/update-post.request.dto';
import { Request } from 'express';
import { PostDto } from '../../application/dto';
import { UpdatePostCommand } from '../../application/command/update-post/update-post.command';
import { PostStatus } from '../../../../database/models/post.model';
import { plainToInstance } from 'class-transformer';
import {
  ContentEmptyGroupException,
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionException,
  ContentNotFoundException,
} from '../../domain/exception';
import { AccessDeniedException } from '../../domain/exception/access-denied.exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { UserNoBelongGroupException } from '../../domain/exception/user-no-belong-group.exception';
import { ContentEmptyException } from '../../domain/exception/content-empty.exception';
import { PostSettingRequestDto } from '../dto/request/post-setting.request.dto';
import { UpdateContentSettingCommand } from '../../application/command/update-content-setting/update-content-setting.command';

@ApiTags('v2 Content')
@ApiSecurity('authorization')
@Controller({
  path: 'content',
  version: DEFAULT_APP_VERSION,
})
export class ContentController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Mark as read' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Put('/:id/mark-as-read')
  public async markRead(
    @AuthUser() authUser: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this._commandBus.execute<MarkReadImportantContentCommand, void>(
      new MarkReadImportantContentCommand({ id, authUser })
    );
  }

  @ApiOperation({ summary: 'Validate series and tags' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Validate article series and tags successfully',
  })
  @Post('/validate-series-tags')
  public async validateSeriesTags(
    @AuthUser() authUser: UserDto,
    @Body() validateSeriesTagDto: ValidateSeriesTagDto
  ): Promise<void> {
    try {
      await this._commandBus.execute<ValidateSeriesTagsCommand, void>(
        new ValidateSeriesTagsCommand({
          groupIds: validateSeriesTagDto.groups,
          seriesIds: validateSeriesTagDto.series,
          tagIds: validateSeriesTagDto.tags,
        })
      );
    } catch (e) {
      switch (e.constructor) {
        case TagSeriesInvalidException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update setting' })
  @Put('/:id/setting')
  public async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto,
    @Body() contentSettingRequestDto: PostSettingRequestDto,
    @Req() req: Request
  ): Promise<void> {
    try {
      await this._commandBus.execute<UpdateContentSettingCommand, void>(
        new UpdateContentSettingCommand({
          ...contentSettingRequestDto,
          id,
          authUser,
        })
      );
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentNoEditSettingPermissionException:
        case ContentNoCRUDPermissionException:
        case AccessDeniedException:
          throw new ForbiddenException(e);
        case DomainModelException:
        case UserNoBelongGroupException:
        case ContentEmptyException:
        case ContentEmptyGroupException:
        case TagSeriesInvalidException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
