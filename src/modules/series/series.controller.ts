import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { SeriesAppService } from './application/series.app-service';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from './dto/requests';
import { GetSeriesSavedDto } from './dto/requests/get-series-saved.dto';

import { SeriesResponseDto } from './dto/responses';
import { GetSeriesPipe } from './pipes';

@ApiSecurity('authorization')
@ApiTags('Series')
@Controller({
  version: APP_VERSION,
  path: 'series',
})
export class SeriesController {
  public constructor(private _seriesAppService: SeriesAppService) {}

  @ApiOperation({ summary: 'Save series' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Post('/:id/save')
  public async save(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<boolean> {
    return this._seriesAppService.savePost(user, id);
  }

  @ApiOperation({ summary: 'unsave series' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Delete('/:id/unsave')
  public async unSave(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<boolean> {
    return this._seriesAppService.unSavePost(user, id);
  }

  @ApiOperation({ summary: 'Get series saved' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Get('/list-saved')
  public async getListSavedByUserId(
    @AuthUser() user: UserDto,
    @Query() getPostsSavedDto: GetSeriesSavedDto
  ): Promise<PageDto<SeriesResponseDto>> {
    return this._seriesAppService.getListSavedByUserId(user, getPostsSavedDto);
  }

  @ApiOperation({ summary: 'Get series detail' })
  @ApiOkResponse({
    type: SeriesResponseDto,
  })
  @Get('/:id')
  public async get(
    @AuthUser(false) user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Query(GetSeriesPipe) getPostDto: GetSeriesDto
  ): Promise<SeriesResponseDto> {
    return this._seriesAppService.getSeriesDetail(user, id, getPostDto);
  }

  @ApiOperation({ summary: 'Create series' })
  @ApiOkResponse({
    type: SeriesResponseDto,
    description: 'Create series successfully',
  })
  @Post('/')
  @InjectUserToBody()
  public async create(
    @AuthUser() user: UserDto,
    @Body() createSeriesDto: CreateSeriesDto
  ): Promise<any> {
    return this._seriesAppService.createSeries(user, createSeriesDto);
  }

  @ApiOperation({ summary: 'Update series' })
  @ApiOkResponse({
    type: SeriesResponseDto,
    description: 'Update series successfully',
  })
  @Put('/:id')
  @InjectUserToBody()
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSeriesDto: UpdateSeriesDto
  ): Promise<SeriesResponseDto> {
    return this._seriesAppService.updateSeries(user, id, updateSeriesDto);
  }

  @ApiOperation({ summary: 'Delete series' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete series successfully',
  })
  @Delete('/:id')
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<boolean> {
    return this._seriesAppService.deleteSeries(user, id);
  }
}
