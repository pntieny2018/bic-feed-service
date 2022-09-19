import { RecentSearchDto, RecentSearchesDto } from './dto/responses';
import { RecentSearchService } from './recent-search.service';
import { CreateRecentSearchDto, GetRecentSearchPostDto } from './dto/requests';
import { CleanRecentSearchesDto } from './dto/requests/clean-recent-searches.dto';
import { ApiTags, ApiSecurity, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Controller, Delete, Get, Post, Query, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AuthUser, UserDto } from '../auth';
import { APP_VERSION } from '../../common/constants';

@ApiSecurity('authorization')
@ApiTags('Recent Searches')
@Controller({
  path: 'recent-searches',
  version: APP_VERSION,
})
export class RecentSearchController {
  public constructor(private _recentSearchService: RecentSearchService) {}

  @ApiOperation({ summary: 'Get recent search list' })
  @ApiOkResponse({
    description: 'Get recent search list successfully',
    type: RecentSearchesDto,
  })
  @Get('/')
  public getRecentSearches(
    @AuthUser() user: UserDto,
    @Query() getRecentSearchPostDto: GetRecentSearchPostDto
  ): Promise<RecentSearchesDto> {
    return this._recentSearchService.get(user.id, getRecentSearchPostDto);
  }

  @ApiOperation({ summary: 'Create recent search' })
  @ApiOkResponse({
    description: 'Create recent search successfully',
    type: RecentSearchDto,
  })
  @Post('/')
  public createRecentSearch(
    @AuthUser() user: UserDto,
    @Body() createRecentSearchPostDto: CreateRecentSearchDto
  ): Promise<RecentSearchDto> {
    return this._recentSearchService.create(user.id, createRecentSearchPostDto);
  }

  @ApiOperation({ summary: 'Delete recent search' })
  @ApiParam({
    name: 'id',
    description: 'Id of recent search item',
  })
  @ApiOkResponse({
    description: 'Delete recent search successfully',
    type: Boolean,
  })
  @Delete('/:id/delete')
  public deleteRecentSearch(
    @AuthUser() user: UserDto,
    @Param('id', ParseIntPipe) id: number
  ): Promise<boolean> {
    return this._recentSearchService.delete(user.id, id);
  }

  @ApiOperation({ summary: 'Clean recent search' })
  @ApiOkResponse({
    description: 'Clean recent search successfully',
    type: Boolean,
  })
  @Delete('/:target/clean')
  public cleanRecentSearches(
    @AuthUser() user: UserDto,
    @Param() cleanRecentSearchesDto: CleanRecentSearchesDto
  ): Promise<boolean> {
    return this._recentSearchService.clean(user.id, cleanRecentSearchesDto.target);
  }
}
