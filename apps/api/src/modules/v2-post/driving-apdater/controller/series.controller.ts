import { CommandBus, QueryBus } from '@nestjs/cqrs';
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
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { UserDto } from '../../../v2-user/application';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import {
  CreateSeriesRequestDto,
  GetItemsBySeriesRequestDto,
  UpdateSeriesRequestDto,
} from '../dto/request';
import {
  CreateSeriesCommand,
  CreateSeriesCommandPayload,
} from '../../application/command/create-series/create-series.command';

import { instanceToInstance, plainToInstance } from 'class-transformer';
import {
  UpdateSeriesCommand,
  UpdateSeriesCommandPayload,
} from '../../application/command/update-series/update-series.command';
import {
  CreateCommentDto,
  CreateSeriesDto,
  FindItemsBySeriesDto,
  SeriesDto,
} from '../../application/dto';
import { FindSeriesQuery } from '../../application/query/find-series/find-series.query';
import {
  DeleteSeriesCommand,
  DeleteSeriesCommandPayload,
} from '../../application/command/delete-series/delete-series.command';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { FindItemsBySeriesQuery } from '../../application/query/find-items-by-series/find-items-by-series.query';

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
  ): Promise<CreateCommentDto> {
    const data = await this._commandBus.execute<CreateSeriesCommand, CreateCommentDto>(
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
