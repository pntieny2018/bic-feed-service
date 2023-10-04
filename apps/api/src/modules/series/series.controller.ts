import { Body, Controller, Delete, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../common/constants';
import { AuthUser, ResponseMessages } from '../../common/decorators';
import { UserDto } from '../v2-user/application';

import { SeriesAppService } from './application/series.app-service';
import { AddItemsInSeriesDto } from './dto/requests/add-items-in-series.dto';
import { DeleteItemsInSeriesDto } from './dto/requests/delete-items-in-series.dto';
import { ReorderItemsDto } from './dto/requests/reorder-items.dto';

@ApiSecurity('authorization')
@ApiTags('Series')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'series',
})
export class SeriesController {
  public constructor(private _seriesAppService: SeriesAppService) {}

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
    const { itemIds } = addItemsInSeriesDto;
    await this._seriesAppService.addItems(id, itemIds, user);
  }
}
