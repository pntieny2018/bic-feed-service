import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { PageDto } from '../../common/dto';
import { GetSeriesDto, CreateSeriesDto, UpdateSeriesDto } from './dto/requests';
import { SeriesResponseDto } from './dto/responses';
import { SeriesService } from './series.service';
import { GetSeriesPipe } from './pipes';
import { ResponseMessages } from '../../common/decorators';
import { AuthUser, UserDto } from '../auth';

@ApiSecurity('authorization')
@ApiTags('Series')
@Controller({
  version: APP_VERSION,
  path: 'series',
})
export class SeriesController {
  private _logger = new Logger(SeriesController.name);

  public constructor(private seriesService: SeriesService) {}

  @ApiOperation({ summary: 'Get series' })
  @ResponseMessages({
    success: 'Get series successfully',
  })
  @Get('/')
  public getSeries(
    @Query(GetSeriesPipe) getSeriesDto: GetSeriesDto
  ): Promise<PageDto<SeriesResponseDto>> {
    this._logger.debug('get series');
    return this.seriesService.getSeries(getSeriesDto);
  }

  @ApiOperation({ summary: 'Create series' })
  @ApiOkResponse({
    type: SeriesResponseDto,
    description: 'Create series successfully',
  })
  @Post('/')
  public async createSeries(
    @AuthUser() user: UserDto,
    @Body() createSeriesDto: CreateSeriesDto
  ): Promise<SeriesResponseDto> {
    const created = await this.seriesService.createSeries(user, createSeriesDto);
    if (created) {
      const result = await this.seriesService.getSeriesById(created.id);
      if (result) {
        return result;
      }
    }
  }

  @ApiOperation({ summary: 'Update series' })
  @ApiOkResponse({
    type: SeriesResponseDto,
    description: 'Update series successfully',
  })
  @Put('/:id')
  public async updateSeries(
    @AuthUser() user: UserDto,
    @Param('id') seriesId: string,
    @Body() updateSeriesDto: UpdateSeriesDto
  ): Promise<SeriesResponseDto> {
    const isUpdated = await this.seriesService.updateSeries(user, seriesId, updateSeriesDto);
    if (isUpdated) {
      const seriesUpdate = await this.seriesService.getSeriesById(seriesId);
      return seriesUpdate;
    }
  }

  @ApiOperation({ summary: 'Delete series' })
  @ApiOkResponse({
    type: SeriesResponseDto,
    description: 'Delete series successfully',
  })
  @Delete('/:id')
  public async deleteSeries(
    @AuthUser() user: UserDto,
    @Param('id') seriesId: string
  ): Promise<boolean> {
    const isDeleted = await this.seriesService.deleteSeries(user, seriesId);
    if (isDeleted) {
      return isDeleted;
    }
    return false;
  }
}
