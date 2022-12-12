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
import { ResponseMessages } from '../../common/decorators';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { SeriesSearchResponseDto } from '../article/dto/responses/series-search.response.dto';
import { AuthUser, UserDto } from '../auth';
import { PostResponseDto } from '../post/dto/responses';
import { SeriesAppService } from './application/series.app-service';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from './dto/requests';
import { AddArticlesInSeriesDto } from './dto/requests/add-articles-in-series.dto';
import { DeleteArticlesInSeriesDto } from './dto/requests/delete-articles-in-series.dto';
import { ReorderArticlesDto } from './dto/requests/reorder-articles.dto';
import { SearchSeriesDto } from './dto/requests/search-series.dto';
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

  @ApiOperation({ summary: 'Reorder articles in series' })
  @ApiOkResponse({
    type: Boolean,
  })
  @ResponseMessages({ success: 'Reorder successful.' })
  @Put('/:id/reorder')
  public async reorder(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reorderArticlesDto: ReorderArticlesDto
  ): Promise<boolean> {
    const { articleIds } = reorderArticlesDto;
    await this._seriesAppService.reorderArticles(id, articleIds, user);
    return true;
  }

  @ApiOperation({ summary: 'Remove article from series' })
  @ApiOkResponse({
    description: 'Remove article successfully',
  })
  @Delete('/:id/remove-articles')
  public async removeArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() deleteArticlesInSeriesDto: DeleteArticlesInSeriesDto,
    @AuthUser() user: UserDto
  ): Promise<void> {
    const { articleIds } = deleteArticlesInSeriesDto;
    await this._seriesAppService.removeArticles(id, articleIds, user);
  }

  @ApiOperation({ summary: 'Add article into series' })
  @ApiOkResponse({
    description: 'Add article successfully',
  })
  @Put('/:id/add-articles')
  public async addArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addArticlesInSeriesDto: AddArticlesInSeriesDto,
    @AuthUser() user: UserDto
  ): Promise<void> {
    const { articleIds } = addArticlesInSeriesDto;
    await this._seriesAppService.addArticles(id, articleIds, user);
  }
}
