import { Controller, Delete, Get, Post, Query, Res, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthUser, UserInfoDto } from '../auth';
import { RecentSearchDto, RecentSearchesDto } from './dto/responses';
import { RecentSearchService } from './recent-search.service';
import { CreateRecentSearchDto, GetRecentSearchPostDto } from './dto/requests';
import { CleanRecentSearchesDto } from './dto/requests/clean-recent-searches.dto';

@ApiSecurity('authorization')
@ApiTags('Recent Searches')
@Controller('recent-searches')
export class RecentSearchController {
  constructor(private _recentSearchPostService: RecentSearchService) {}

  @ApiOperation({ summary: 'Get recent search list' })
  @ApiOkResponse({
    description: 'Get recent search list successfully',
    type: RecentSearchesDto,
  })
  @Get('/')
  public getRecentSearches(
    @AuthUser() user: UserInfoDto,
    @Query() getRecentSearchPostDto: GetRecentSearchPostDto
  ): Promise<RecentSearchesDto> {
    return this._recentSearchPostService.get(user.beinUserId, getRecentSearchPostDto);
  }

  @ApiOperation({ summary: 'Create recent search' })
  @ApiOkResponse({
    description: 'Create recent search successfully',
    type: RecentSearchDto,
  })
  @Post('/')
  public createRecentSearch(
    @AuthUser() user: UserInfoDto,
    @Body() createRecentSearchPostDto: CreateRecentSearchDto
  ): Promise<RecentSearchDto> {
    return this._recentSearchPostService.create(user.beinUserId, createRecentSearchPostDto);
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
  public deleteRecentSearchForPost(
    @AuthUser() user: UserInfoDto,
    @Param('id', ParseIntPipe) id: number
  ): Promise<boolean> {
    return this._recentSearchPostService.delete(user.beinUserId, id);
  }

  @ApiOperation({ summary: 'Clean recent search' })
  @ApiOkResponse({
    description: 'Clean recent search successfully',
    type: Boolean,
  })
  @Delete('/:target/clean')
  public cleanRecentSearchesForPost(
    @AuthUser() user: UserInfoDto,
    @Param() cleanRecentSearchesDto: CleanRecentSearchesDto
  ): Promise<boolean> {
    return this._recentSearchPostService.clean(user.beinUserId, cleanRecentSearchesDto.target);
  }
}
