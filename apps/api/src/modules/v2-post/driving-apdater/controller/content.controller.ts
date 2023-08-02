import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { instanceToInstance } from 'class-transformer';
import { UserDto } from '../../../v2-user/application';
import { TRANSFORMER_VISIBLE_ONLY, VERSIONS_SUPPORTED } from '../../../../common/constants';
import { MarkReadImportantContentCommand } from '../../application/command/mark-read-important-content/mark-read-important-content.command';
import { ValidateSeriesTagsCommand } from '../../application/command/validate-series-tags/validate-series-tag.command';
import { GetDraftContentsRequestDto, ValidateSeriesTagDto } from '../dto/request';
import { PostSettingRequestDto } from '../dto/request/post-setting.request.dto';
import { UpdateContentSettingCommand } from '../../application/command/update-content-setting/update-content-setting.command';
import { FindDraftContentsQuery } from '../../application/query/find-draft-contents/find-draft-contents.query';
import { FindDraftContentsDto } from '../../application/query/find-draft-contents/find-draft-contents.dto';

@ApiTags('v2 Content')
@ApiSecurity('authorization')
@Controller({
  path: 'content',
  version: VERSIONS_SUPPORTED,
})
export class ContentController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Get draft contents' })
  @ApiOkResponse({
    type: FindDraftContentsDto,
  })
  @ResponseMessages({
    success: 'Get draft contents successfully',
  })
  @Get('/draft')
  public async getDrafts(
    @AuthUser() user: UserDto,
    @Query() getListCommentsDto: GetDraftContentsRequestDto
  ): Promise<FindDraftContentsDto> {
    const data = await this._queryBus.execute(
      new FindDraftContentsQuery({ authUser: user, ...getListCommentsDto })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

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
    await this._commandBus.execute<ValidateSeriesTagsCommand, void>(
      new ValidateSeriesTagsCommand({
        groupIds: validateSeriesTagDto.groups,
        seriesIds: validateSeriesTagDto.series,
        tagIds: validateSeriesTagDto.tags,
      })
    );
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
    await this._commandBus.execute<UpdateContentSettingCommand, void>(
      new UpdateContentSettingCommand({
        ...contentSettingRequestDto,
        id,
        authUser,
      })
    );
  }
}
