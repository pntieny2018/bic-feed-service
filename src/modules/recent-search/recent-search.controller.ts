import { UserSharedDto } from './../../shared/user/dto/user-shared.dto';
//import { AuthUser, UserInfoDto } from '../auth';
import { RecentSearchDto, RecentSearchesDto } from './dto/responses';
import { RecentSearchService } from './recent-search.service';
import { CreateRecentSearchDto, GetRecentSearchPostDto } from './dto/requests';
import { CleanRecentSearchesDto } from './dto/requests/clean-recent-searches.dto';
import { ApiTags, ApiSecurity, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Controller, Delete, Get, Post, Query, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AuthUser } from '../auth';

@ApiSecurity('authorization')
@ApiTags('Recent Searches')
@Controller('recent-searches')
export class RecentSearchController {
  public constructor(private _recentSearchPostService: RecentSearchService) {}

  @ApiOperation({ summary: 'Get recent search list' })
  @ApiOkResponse({
    description: 'Get recent search list successfully',
    type: RecentSearchesDto,
  })
  @Get('/')
  public getRecentSearches(
    @AuthUser() user: UserSharedDto,
    @Query() getRecentSearchPostDto: GetRecentSearchPostDto
  ): Promise<RecentSearchesDto> {
    return this._recentSearchPostService.get(user.id, getRecentSearchPostDto);
  }

  @ApiOperation({ summary: 'Create recent search' })
  @ApiOkResponse({
    description: 'Create recent search successfully',
    type: RecentSearchDto,
  })
  @Post('/')
  public createRecentSearch(
    @AuthUser() user: UserSharedDto,
    @Body() createRecentSearchPostDto: CreateRecentSearchDto
  ): Promise<RecentSearchDto> {
    return this._recentSearchPostService.create(user.id, createRecentSearchPostDto);
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
    @AuthUser() user: UserSharedDto,
    @Param('id', ParseIntPipe) id: number
  ): Promise<boolean> {
    return this._recentSearchPostService.delete(user.id, id);
  }

  @ApiOperation({ summary: 'Clean recent search' })
  @ApiOkResponse({
    description: 'Clean recent search successfully',
    type: Boolean,
  })
  @Delete('/:target/clean')
  public cleanRecentSearchesForPost(
    @AuthUser() user: UserSharedDto,
    @Param() cleanRecentSearchesDto: CleanRecentSearchesDto
  ): Promise<boolean> {
    return this._recentSearchPostService.clean(user.id, cleanRecentSearchesDto.target);
  }
}
