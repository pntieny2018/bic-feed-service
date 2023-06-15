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
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { MarkReadImportantContentCommand } from '../../application/command/mark-read-important-content/mark-read-important-content.command';
import { ValidateSeriesTagsCommand } from '../../application/command/validate-series-tags/validate-series-tag.command';
import { ValidateSeriesTagDto } from '../dto/request';
import { TagSeriesInvalidException } from '../../domain/exception/tag-series-invalid.exception';
import {
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionAtGroupException,
  ContentNoEditSettingPermissionException,
  ContentNotFoundException,
} from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { UserNoBelongGroupException } from '../../domain/exception/user-no-belong-group.exception';
import { PostSettingRequestDto } from '../dto/request/post-setting.request.dto';
import { UpdateContentSettingCommand } from '../../application/command/update-content-setting/update-content-setting.command';

@ApiTags('v2 Content')
@ApiSecurity('authorization')
@Controller({
  path: 'content',
  version: VERSIONS_SUPPORTED,
})
export class ContentController {
  public constructor(private readonly _commandBus: CommandBus) {}

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
  @ApiOkResponse({
    description: 'Edited setting successfully',
  })
  @ResponseMessages({
    success: 'message.content.edited_setting_success',
  })
  @Put('/:id/setting')
  public async updatePostSetting(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto,
    @Body() contentSettingRequestDto: PostSettingRequestDto
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
        case ContentNoCRUDPermissionException:
        case ContentNoEditSettingPermissionException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        case DomainModelException:
        case UserNoBelongGroupException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
