import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Delete,
  Version,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance, plainToInstance } from 'class-transformer';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { PageDto } from '../../../../common/dto';
import { UserDto } from '../../../v2-user/application';
import {
  AddSeriesItemsCommand,
  CreateSeriesCommand,
  CreateSeriesCommandPayload,
  DeleteSeriesCommand,
  DeleteSeriesCommandPayload,
  RemoveSeriesItemsCommand,
  ReorderSeriesItemsCommand,
  UpdateSeriesCommand,
  UpdateSeriesCommandPayload,
} from '../../application/command/series';
import {
  CreateSeriesDto,
  FindItemsBySeriesDto,
  SearchContentsBySeriesDto,
  SearchSeriesDto,
  SeriesDto,
} from '../../application/dto';
import {
  FindItemsBySeriesQuery,
  FindSeriesQuery,
  SearchContentsBySeriesQuery,
  SearchSeriesQuery,
} from '../../application/query/series';
import {
  ChangeItemsInSeriesRequestDto,
  CreateSeriesRequestDto,
  GetItemsBySeriesRequestDto,
  SearchContentsBySeriesRequestDto,
  SearchSeriesRequestDto,
  UpdateSeriesRequestDto,
} from '../dto/request';

@ApiTags('Series v2')
@ApiSecurity('authorization')
@Controller()
export class SeriesController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Create new series' })
  @ApiOkResponse({
    type: CreateSeriesDto,
    description: 'Create series successfully',
  })
  @ResponseMessages({
    success: 'message.series.created_success',
  })
  @Post(ROUTES.SERIES.CREATE.PATH)
  @Version(ROUTES.SERIES.CREATE.VERSIONS)
  public async create(
    @AuthUser() user: UserDto,
    @Body() createSeriesRequestDto: CreateSeriesRequestDto
  ): Promise<CreateSeriesDto> {
    const data = await this._commandBus.execute<CreateSeriesCommand, CreateSeriesDto>(
      new CreateSeriesCommand({
        ...createSeriesRequestDto,
        actor: user,
        groupIds: createSeriesRequestDto.audience?.groupIds,
      } as CreateSeriesCommandPayload)
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Reorder items in series' })
  @ApiOkResponse({
    description: 'Reorder article/posts into series successfully',
  })
  @ResponseMessages({ success: 'Reorder successful.' })
  @Put(ROUTES.SERIES.REORDER_ITEMS.PATH)
  @Version(ROUTES.SERIES.REORDER_ITEMS.VERSIONS)
  public async reorder(
    @AuthUser() authUser: UserDto,
    @Param('seriesId', ParseUUIDPipe) id: string,
    @Body() reorderItemsDto: ChangeItemsInSeriesRequestDto
  ): Promise<boolean> {
    return this._commandBus.execute(
      new ReorderSeriesItemsCommand({ authUser, ...reorderItemsDto, id })
    );
  }

  @ApiOperation({ summary: 'Add article or post into serie' })
  @ApiOkResponse({
    description: 'Add article/posts into series successfully',
  })
  @ResponseMessages({
    success: 'message.series.added_success',
  })
  @Put(ROUTES.SERIES.ADD_ITEMS.PATH)
  @Version(ROUTES.SERIES.ADD_ITEMS.VERSIONS)
  public async addItems(
    @AuthUser() authUser: UserDto,
    @Param('seriesId', ParseUUIDPipe) id: string,
    @Body() addItemsInSeriesDto: ChangeItemsInSeriesRequestDto
  ): Promise<void> {
    return this._commandBus.execute(
      new AddSeriesItemsCommand({ authUser, ...addItemsInSeriesDto, id })
    );
  }

  @ApiOperation({ summary: 'Remove article or post from series' })
  @ApiOkResponse({
    description: 'Remove article/posts from series successfully',
  })
  @ResponseMessages({
    success: 'message.series.removed_success',
  })
  @Put(ROUTES.SERIES.REMOVE_ITEMS.PATH)
  @Version(ROUTES.SERIES.REMOVE_ITEMS.VERSIONS)
  public async removeItems(
    @AuthUser() authUser: UserDto,
    @Param('seriesId', ParseUUIDPipe) id: string,
    @Body() removeItemsInSeriesDto: ChangeItemsInSeriesRequestDto
  ): Promise<void> {
    return this._commandBus.execute(
      new RemoveSeriesItemsCommand({ authUser, ...removeItemsInSeriesDto, id })
    );
  }

  @ApiOperation({ summary: 'Update series' })
  @ApiOkResponse({
    description: 'Update series successfully',
  })
  @ResponseMessages({
    success: 'message.series.updated_success',
  })
  @Put(ROUTES.SERIES.UPDATE.PATH)
  @Version(ROUTES.SERIES.UPDATE.VERSIONS)
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSeriesRequestDto: UpdateSeriesRequestDto
  ): Promise<SeriesDto> {
    const data = await this._commandBus.execute<UpdateSeriesCommand, SeriesDto>(
      new UpdateSeriesCommand({
        ...updateSeriesRequestDto,
        id,
        actor: user,
        groupIds: updateSeriesRequestDto.audience?.groupIds,
      } as UpdateSeriesCommandPayload)
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Get items by series' })
  @Get(ROUTES.SERIES.GET_ITEMS_BY_SERIES.PATH)
  @Version(ROUTES.SERIES.GET_ITEMS_BY_SERIES.VERSIONS)
  public async getItemsBySeries(
    @AuthUser() authUser: UserDto,
    @Query() getItemsBySeriesRequestDto: GetItemsBySeriesRequestDto
  ): Promise<FindItemsBySeriesDto> {
    const result = await this._queryBus.execute<FindItemsBySeriesQuery, FindItemsBySeriesDto>(
      new FindItemsBySeriesQuery({
        seriesIds: getItemsBySeriesRequestDto.seriesIds,
        authUser,
      })
    );
    return plainToInstance(FindItemsBySeriesDto, result, {
      groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC],
    });
  }

  @ApiOperation({ summary: 'Search post/article to add into series' })
  @ApiOkResponse({
    type: SearchContentsBySeriesDto,
  })
  @ResponseMessages({
    success: 'Search post/article successfully',
  })
  @Version(ROUTES.SERIES.SEARCH_CONTENTS_BY_SERIES.VERSIONS)
  @Get(ROUTES.SERIES.SEARCH_CONTENTS_BY_SERIES.PATH)
  public async searchContents(
    @AuthUser() authUser: UserDto,
    @Param('seriesId', ParseUUIDPipe) seriesId: string,
    @Query() searchContentsBySeriesRequestDto: SearchContentsBySeriesRequestDto
  ): Promise<SearchContentsBySeriesDto> {
    const data = await this._queryBus.execute(
      new SearchContentsBySeriesQuery({ authUser, seriesId, ...searchContentsBySeriesRequestDto })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Get series detail' })
  @Get(ROUTES.SERIES.GET_DETAIL.PATH)
  @Version(ROUTES.SERIES.GET_DETAIL.VERSIONS)
  public async getPostDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto
  ): Promise<SeriesDto> {
    const data = await this._queryBus.execute(new FindSeriesQuery({ seriesId: id, authUser }));
    return plainToInstance(SeriesDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Search series' })
  @ApiOkResponse({
    type: PageDto<SearchSeriesDto>,
  })
  @ResponseMessages({
    success: 'Search series successfully',
  })
  @Version(ROUTES.SERIES.SEARCH_SERIES.VERSIONS)
  @Get(ROUTES.SERIES.SEARCH_SERIES.PATH)
  public async searchSeries(
    @AuthUser() authUser: UserDto,
    @Query() searchSeriesRequestDto: SearchSeriesRequestDto
  ): Promise<PageDto<SearchSeriesDto>> {
    const data = await this._queryBus.execute(
      new SearchSeriesQuery({ authUser, ...searchSeriesRequestDto })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Delete series' })
  @ApiOkResponse({
    description: 'Delete series successfully',
  })
  @ResponseMessages({
    success: 'message.series.deleted_success',
  })
  @Delete(ROUTES.SERIES.DELETE.PATH)
  @Version(ROUTES.SERIES.DELETE.VERSIONS)
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this._commandBus.execute<DeleteSeriesCommand, void>(
      new DeleteSeriesCommand({
        id,
        actor: user,
      } as DeleteSeriesCommandPayload)
    );
  }
}
