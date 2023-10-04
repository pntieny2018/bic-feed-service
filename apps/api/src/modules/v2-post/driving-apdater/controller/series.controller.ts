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
  CreateSeriesCommand,
  CreateSeriesCommandPayload,
  DeleteSeriesCommand,
  DeleteSeriesCommandPayload,
  UpdateSeriesCommand,
  UpdateSeriesCommandPayload,
} from '../../application/command/series';
import {
  CreateSeriesDto,
  FindItemsBySeriesDto,
  SearchSeriesDto,
  SeriesDto,
} from '../../application/dto';
import {
  FindItemsBySeriesQuery,
  FindSeriesQuery,
  SearchSeriesQuery,
} from '../../application/query/series';
import {
  CreateSeriesRequestDto,
  GetItemsBySeriesRequestDto,
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
    const data = this._queryBus.execute(
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
