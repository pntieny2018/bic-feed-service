import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../../../common/constants';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClassTransformer } from 'class-transformer';
import { GetRecentSearchRequestDto } from '../dto/request/tag/get-recent-search.request.dto';
import { RecentSearchesResponseDto } from '../dto/response/recent-search.response';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { CreateRecentSearchRequestDto } from '../dto/request/tag/create-recent-search.request.dto';
import { PostType } from '../../data-type';
import { CleanRecentSearchesDto } from '../../../recent-search/dto/requests/clean-recent-searches.dto';
import { FindRecentSearchesPaginationQuery } from '../../application/query/find-recent-searches/find-recent-searches-pagination.query';

@ApiTags('Recent Searches')
@ApiSecurity('authorization')
@Controller({
  path: 'recent-searches',
  version: APP_VERSION,
})
export class RecentSearchController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}
  private _classTransformer = new ClassTransformer();
  @ApiOperation({ summary: 'Get recent search list' })
  @ApiOkResponse({
    description: 'Get recent search list successfully',
    type: RecentSearchesResponseDto,
  })
  @Get('/')
  public async getRecentSearches(
    @AuthUser() user: UserDto,
    @Query() getRecentSearchRequestDto: GetRecentSearchRequestDto
  ): Promise<RecentSearchesResponseDto> {
    const { target, offset, limit } = getRecentSearchRequestDto;
    const { rows } = await this._queryBus.execute(
      new FindRecentSearchesPaginationQuery({ target, offset, limit })
    );
    const recentSearches = rows.map((row) =>
      this._classTransformer.plainToInstance(RecentSearchesResponseDto, row, {
        excludeExtraneousValues: true,
      })
    );

    return new RecentSearchesResponseDto({
      target: target as PostType,
      recentSearches,
    });
  }

  @ApiOperation({ summary: 'Create recent search' })
  @ApiOkResponse({
    description: 'Create recent search successfully',
    type: RecentSearchesResponseDto,
  })
  @Post('/')
  public async createRecentSearch(
    @AuthUser() user: UserDto,
    @Body() createRecentSearchRequestDto: CreateRecentSearchRequestDto
  ): Promise<RecentSearchesResponseDto> {
    const { target, keyword } = createRecentSearchRequestDto;
    const { rows } = await this._queryBus.execute(
      new FindRecentSearchesPaginationQuery({ keyword, target, offset: 0, limit: 1 })
    );
    const recentSearches = rows.map((row) =>
      this._classTransformer.plainToInstance(RecentSearchesResponseDto, row, {
        excludeExtraneousValues: true,
      })
    );

    return new RecentSearchesResponseDto({
      target: target as PostType,
      recentSearches,
    });
  }

  @ApiOperation({ summary: 'Delete recent search' })
  @ApiOkResponse({
    description: 'Delete recent search successfully',
    type: Boolean,
  })
  @Delete('/:id/delete')
  public async deleteRecentSearch(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<boolean> {
    return true;
  }

  @ApiOperation({ summary: 'Clean recent search' })
  @ApiOkResponse({
    description: 'Clean recent search successfully',
    type: Boolean,
  })
  @Delete('/:target/clean')
  public async cleanRecentSearch(
    @AuthUser() user: UserDto,
    @Param() cleanRecentSearchesDto: CleanRecentSearchesDto
  ): Promise<boolean> {
    return true;
  }
}
