import { UserDto } from '@libs/service/user';
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

import { TRANSFORMER_VISIBLE_ONLY, VERSIONS_SUPPORTED } from '../../../../common/constants';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import {
  MarkReadImportantContentCommand,
  ReorderPinnedContentCommand,
  SeenContentCommand,
  UpdateContentSettingCommand,
} from '../../application/command/content';
import { ValidateSeriesTagsCommand } from '../../application/command/tag';
import {
  GetScheduleContentsResponseDto,
  MenuSettingsDto,
  FindDraftContentsDto,
  SearchContentsDto,
  GetSeriesResponseDto,
  ArticleDto,
  PostDto,
  SeriesDto,
} from '../../application/dto';
import {
  FindDraftContentsQuery,
  GetSeriesInContentQuery,
  GetMenuSettingsQuery,
  GetTotalDraftQuery,
  SearchContentsQuery,
  FindPinnedContentQuery,
} from '../../application/query/content';
import { GetScheduleContentQuery } from '../../application/query/content/get-schedule-content';
import {
  GetDraftContentsRequestDto,
  GetScheduleContentsQueryDto,
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
  @Get(ROUTES.CONTENT.GET_DRAFTS.PATH)
  @Version(ROUTES.CONTENT.GET_DRAFTS.VERSIONS)
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
  @Version(ROUTES.CONTENT.GET_MENU_SETTINGS.VERSIONS)
  @Get(ROUTES.CONTENT.GET_MENU_SETTINGS.PATH)
  public async getMenuSettings(
    @AuthUser() user: UserDto,
    @Param('contentId', ParseUUIDPipe) id: string
  ): Promise<MenuSettingsDto> {
    return this._queryBus.execute(new GetMenuSettingsQuery({ authUser: user, id }));
  }

  @ApiOperation({ summary: 'Get total draft contents' })
  @ApiOkResponse({
    type: Number,
    description: 'Get total draft contents',
  })
  @Get(ROUTES.CONTENT.GET_TOTAL_DRAFT.PATH)
  @Version(ROUTES.CONTENT.GET_TOTAL_DRAFT.VERSIONS)
  public async getTotalDraft(@AuthUser() user: UserDto): Promise<number> {
    return this._queryBus.execute(new GetTotalDraftQuery(user));
  }

  @ApiOperation({ summary: 'Get schedule contents' })
  @ApiOkResponse({
    type: GetScheduleContentsResponseDto,
    description: 'Get schedule contents',
  })
  @Get(ROUTES.CONTENT.GET_SCHEDULE.PATH)
  @Version(ROUTES.CONTENT.GET_SCHEDULE.VERSIONS)
  public async getScheduleContents(
    @AuthUser() user: UserDto,
    @Query() query: GetScheduleContentsQueryDto
  ): Promise<GetScheduleContentsResponseDto> {
    const { limit, before, after, order, type } = query;
    const contents = await this._queryBus.execute<
      GetScheduleContentQuery,
      GetScheduleContentsResponseDto
    >(
      new GetScheduleContentQuery({
        limit,
        before,
        after,
        order,
        type,
        user,
      })
    );
    return instanceToInstance(contents, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Get series in content' })
  @ApiOkResponse({
    type: GetSeriesResponseDto,
    description: 'View series',
  })
  @Get(ROUTES.CONTENT.GET_SERIES.PATH)
  @Version(ROUTES.CONTENT.GET_SERIES.VERSIONS)
  public async getSeries(
    @AuthUser() authUser: UserDto,
    @Param('contentId', ParseUUIDPipe) contentId: string
  ): Promise<GetSeriesResponseDto> {
    const contents = await this._queryBus.execute<GetSeriesInContentQuery, GetSeriesResponseDto>(
      new GetSeriesInContentQuery({
        authUser,
        contentId,
      })
    );
    return instanceToInstance(contents, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Get pinned contents in group' })
  @ApiOkResponse({})
  @Get(ROUTES.CONTENT.GET_PINNED_CONTENT.PATH)
  @Version(ROUTES.CONTENT.GET_PINNED_CONTENT.VERSIONS)
  public async getPinnedContent(
    @AuthUser() authUser: UserDto,
    @Param('groupId', ParseUUIDPipe) groupId: string
  ): Promise<(ArticleDto | PostDto | SeriesDto)[]> {
    const contents = await this._queryBus.execute<FindPinnedContentQuery>(
      new FindPinnedContentQuery({
        authUser,
        groupId,
      })
    );
    return instanceToInstance(contents, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Search contents' })
  @ApiOkResponse({
    type: FindDraftContentsDto,
  })
  @ResponseMessages({
    success: 'Search contents successfully',
  })
  @Version(ROUTES.CONTENT.SEARCH_CONTENTS.VERSIONS)
  @Get(ROUTES.CONTENT.SEARCH_CONTENTS.PATH)
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
  @Put(ROUTES.CONTENT.MARK_AS_READ.PATH)
  @Version(ROUTES.CONTENT.MARK_AS_READ.VERSIONS)
  public async markRead(
    @AuthUser() authUser: UserDto,
    @Param('contentId', ParseUUIDPipe) id: string
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
  @Post(ROUTES.CONTENT.VALIDATE_SERIES_TAGS.PATH)
  @Version(ROUTES.CONTENT.VALIDATE_SERIES_TAGS.VERSIONS)
  public async validateSeriesTags(
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
  @Put(ROUTES.CONTENT.UPDATE_SETTINGS.PATH)
  @Version(ROUTES.CONTENT.UPDATE_SETTINGS.VERSIONS)
  public async updatePostSetting(
    @Param('contentId', ParseUUIDPipe) id: string,
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

  @ApiOperation({ summary: 'Reorder pinned conttent in group' })
  @ApiOkResponse({
    description: 'Reorder pinned content in group successfully',
  })
  @ResponseMessages({
    success: 'message.content.reorder_pin_content_success',
  })
  @Version(ROUTES.CONTENT.REORDER_PIN_CONTENT.VERSIONS)
  @Post(ROUTES.CONTENT.REORDER_PIN_CONTENT.PATH)
  public async reorderItem(
    @AuthUser() authUser: UserDto,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() contentIds: string[]
  ): Promise<void> {
    await this._commandBus.execute<ReorderPinnedContentCommand, void>(
      new ReorderPinnedContentCommand({
        groupId,
        authUser,
        contentIds,
      })
    );
  }

  @ApiOperation({ summary: 'Mark content as seen' })
  @ApiOkResponse({
    description: 'Mark content as seen successfully',
  })
  @ResponseMessages({
    success: 'message.content.mark_as_seen_success',
  })
  @Version(ROUTES.CONTENT.SEEN_CONTENT.VERSIONS)
  @Put(ROUTES.CONTENT.SEEN_CONTENT.PATH)
  public async seenContent(
    @AuthUser() authUser: UserDto,
    @Param('contentId', ParseUUIDPipe) contentId: string
  ): Promise<void> {
    await this._commandBus.execute(
      new SeenContentCommand({
        authUser,
        contentId,
      })
    );
  }
}
