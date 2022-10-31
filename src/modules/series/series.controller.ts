import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { PageDto } from '../../common/dto';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from './dto/requests';
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

  public constructor(private _seriesService: SeriesService) {}

  @ApiOperation({ summary: 'Get series' })
  @ResponseMessages({
    success: 'Get series successfully',
  })
  @Get('/')
  public get(
    @Query(GetSeriesPipe) getSeriesDto: GetSeriesDto
  ): Promise<PageDto<SeriesResponseDto>> {
    return this._seriesService.get(getSeriesDto);
  }

  @ApiOperation({ summary: 'Create series' })
  @ApiOkResponse({
    type: SeriesResponseDto,
    description: 'Create series successfully',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body() createSeriesDto: CreateSeriesDto
  ): Promise<SeriesResponseDto> {
    const created = await this._seriesService.create(user, createSeriesDto);
    if (created) {
      const result = await this._seriesService.getById(created.id);
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
  public async update(
    @AuthUser() user: UserDto,
    @Param('id') seriesId: string,
    @Body() updateSeriesDto: UpdateSeriesDto
  ): Promise<SeriesResponseDto> {
    const isUpdated = await this._seriesService.update(user, seriesId, updateSeriesDto);
    if (isUpdated) {
      return this._seriesService.getById(seriesId);
    }
  }

  @ApiOperation({ summary: 'Delete series' })
  @ApiOkResponse({
    type: SeriesResponseDto,
    description: 'Delete series successfully',
  })
  @Delete('/:id')
  public async delete(@AuthUser() user: UserDto, @Param('id') seriesId: string): Promise<boolean> {
    const isDeleted = await this._seriesService.delete(user, seriesId);
    if (isDeleted) {
      return isDeleted;
    }
    return false;
  }
}
