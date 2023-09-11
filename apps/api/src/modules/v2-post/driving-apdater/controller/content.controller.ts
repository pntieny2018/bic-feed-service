import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance } from 'class-transformer';

import {
  TRANSFORMER_VISIBLE_ONLY,
  VERSIONS_SUPPORTED,
  VERSION_1_9_0,
} from '../../../../common/constants';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { AppHelper } from '../../../../common/helpers/app.helper';
import { UserDto } from '../../../v2-user/application';
import {
  MarkReadImportantContentCommand,
  UpdateContentSettingCommand,
} from '../../application/command/content';
import { ValidateSeriesTagsCommand } from '../../application/command/tag';
import { MenuSettingsDto } from '../../application/dto';
import { FindDraftContentsDto, SearchContentsDto } from '../../application/dto/content.dto';
import {
  FindDraftContentsQuery,
  GetMenuSettingsQuery,
  SearchContentsQuery,
} from '../../application/query/content';
import {
  GetDraftContentsRequestDto,
  PostSettingRequestDto,
  SearchContentsRequestDto,
  ValidateSeriesTagDto,
} from '../dto/request';

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

  @ApiOperation({ summary: 'Get menu settings' })
  @ApiOkResponse({
    type: MenuSettingsDto,
  })
  @ResponseMessages({
    success: 'Get menu settings successfully',
  })
  @Version(AppHelper.getVersionsSupportedFrom(VERSION_1_9_0))
  @Get('/:id/menu-settings')
  public async getMenuSettings(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<MenuSettingsDto> {
    return this._queryBus.execute(new GetMenuSettingsQuery({ authUser: user, id }));
  }

  @ApiOperation({ summary: 'Search contents' })
  @ApiOkResponse({
    type: FindDraftContentsDto,
  })
  @ResponseMessages({
    success: 'Search contents successfully',
  })
  @Version(AppHelper.getVersionsSupportedFrom(VERSION_1_9_0))
  @Get('/')
  public async searchContents(
    @AuthUser() user: UserDto,
    @Query() searchContentsRequestDto: SearchContentsRequestDto
  ): Promise<SearchContentsDto> {
    const data = await this._queryBus.execute(
      new SearchContentsQuery({ authUser: user, ...searchContentsRequestDto })
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
