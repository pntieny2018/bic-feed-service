import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Version,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { VERSIONS_SUPPORTED } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { SeriesSearchResponseDto } from './dto/responses/series-search.response.dto';
import { AuthUser } from '../auth';
import { PostResponseDto } from '../post/dto/responses';
import { SeriesAppService } from './application/series.app-service';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from './dto/requests';
import { AddItemsInSeriesDto } from './dto/requests/add-items-in-series.dto';
import { DeleteItemsInSeriesDto } from './dto/requests/delete-items-in-series.dto';
import { ReorderItemsDto } from './dto/requests/reorder-items.dto';
import { SearchSeriesDto } from './dto/requests/search-series.dto';
import { SeriesResponseDto } from './dto/responses';
import { GetSeriesPipe } from './pipes';
import { UserDto } from '../v2-user/application';
import {
  ArticleLimitAttachedSeriesException,
  ContentRequireGroupException,
  SeriesNoReadPermissionException,
} from '../v2-post/domain/exception';

@ApiSecurity('authorization')
@ApiTags('Series')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'series',
})
export class SeriesController {
  public constructor(private _seriesAppService: SeriesAppService) {}

  @ApiOperation({ summary: 'Search series' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/')
  public searchSeries(
    @AuthUser() user: UserDto,
    @Query() searchDto: SearchSeriesDto
  ): Promise<PageDto<SeriesSearchResponseDto>> {
    return this._seriesAppService.searchSeries(user, searchDto);
  }

  @ApiOperation({ summary: 'Get series detail' })
  @ApiOkResponse({
    type: SeriesResponseDto,
  })
  @Get('/:id')
  @Version([VERSIONS_SUPPORTED[0], VERSIONS_SUPPORTED[1]])
  public async get(
    @AuthUser(false) user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Query(GetSeriesPipe) getPostDto: GetSeriesDto
  ): Promise<SeriesResponseDto> {
    try {
      const series = await this._seriesAppService.getSeriesDetail(user, id, getPostDto);
      return series;
    } catch (e) {
      switch (e.constructor) {
        case ContentRequireGroupException:
          throw new ForbiddenException(e);
        case SeriesNoReadPermissionException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Create series' })
  @ApiOkResponse({
    type: SeriesResponseDto,
    description: 'Create series successfully',
  })
  @ResponseMessages({
    success: 'message.series.created_success',
  })
  @Post('/')
  @InjectUserToBody()
  @Version([VERSIONS_SUPPORTED[0], VERSIONS_SUPPORTED[1]])
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
  @ResponseMessages({
    success: 'message.series.updated_success',
  })
  @Put('/:id')
  @Version([VERSIONS_SUPPORTED[0], VERSIONS_SUPPORTED[1]])
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
  @ResponseMessages({
    success: 'message.series.deleted_success',
  })
  @Version([VERSIONS_SUPPORTED[0], VERSIONS_SUPPORTED[1]])
  @Delete('/:id')
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<boolean> {
    return this._seriesAppService.deleteSeries(user, id);
  }

  @ApiOperation({ summary: 'Reorder articles in series' })
  @ApiOkResponse({
    type: Boolean,
  })
  @ResponseMessages({ success: 'Reorder successful.' })
  @Put('/:id/reorder')
  public async reorder(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reorderItemsDto: ReorderItemsDto
  ): Promise<boolean> {
    const { itemIds } = reorderItemsDto;
    await this._seriesAppService.reorderItems(id, itemIds, user);
    return true;
  }

  @ApiOperation({ summary: 'Remove article or post from series' })
  @ApiOkResponse({
    description: 'Remove article/posts successfully',
  })
  @ResponseMessages({
    success: 'message.series.removed_success',
  })
  @Delete('/:id/remove-items')
  public async removeArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() deleteItemsInSeriesDto: DeleteItemsInSeriesDto,
    @AuthUser() user: UserDto
  ): Promise<void> {
    const { itemIds } = deleteItemsInSeriesDto;
    await this._seriesAppService.removeItems(id, itemIds, user);
  }

  @ApiOperation({ summary: 'Add item into series' })
  @ApiOkResponse({
    description: 'Add article/posts successfully',
  })
  @ResponseMessages({
    success: 'message.series.added_success',
  })
  @Put('/:id/add-items')
  public async addArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addItemsInSeriesDto: AddItemsInSeriesDto,
    @AuthUser() user: UserDto
  ): Promise<void> {
    try {
      const { itemIds } = addItemsInSeriesDto;
      await this._seriesAppService.addItems(id, itemIds, user);
    } catch (e) {
      switch (e.constructor) {
        case ArticleLimitAttachedSeriesException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
