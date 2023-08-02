import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClassTransformer } from 'class-transformer';
import { GetRecentSearchRequestDto } from '../dto/request/get-recent-search.request.dto';
import { RecentSearchesResponseDto } from '../dto/response/recent-searches.response.dto';
import { UserDto } from '../../../v2-user/application';
import { CreateRecentSearchRequestDto } from '../dto/request/create-recent-search.request.dto';
import { CleanRecentSearchesDto } from '../../../recent-search/dto/requests/clean-recent-searches.dto';
import { FindRecentSearchesPaginationQuery } from '../../aplication/query/find-recent-searches/find-recent-searches-pagination.query';
import { DeleteRecentSearchCommand } from '../../aplication/command/delete-recent-search/delete-recent-search.command';
import { RecentSearchResponseDto } from '../dto/response/recent-search.response.dto';
import { CreateRecentSearchCommand } from '../../aplication/command/create-recent-search/create-recent-search.command';
import { CreateRecentSearchDto } from '../../aplication/command/create-recent-search/create-recent-search.dto';
import { AuthUser } from '../../../../common/decorators';

@ApiTags('Recent Searches')
@ApiSecurity('authorization')
@Controller({
  path: 'recent-searches',
  version: VERSIONS_SUPPORTED,
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
    const { target, offset, limit, order } = getRecentSearchRequestDto;
    const { rows } = await this._queryBus.execute(
      new FindRecentSearchesPaginationQuery({ target, offset, order, limit, userId: user.id })
    );
    const recentSearches = rows.map((row) =>
      this._classTransformer.plainToInstance(RecentSearchResponseDto, row, {
        excludeExtraneousValues: true,
      })
    );

    return new RecentSearchesResponseDto({
      target: target,
      recentSearches,
    });
  }

  @ApiOperation({ summary: 'Create recent search' })
  @ApiOkResponse({
    description: 'Create recent search successfully',
    type: RecentSearchResponseDto,
  })
  @Post('/')
  public async createRecentSearch(
    @AuthUser() user: UserDto,
    @Body() createRecentSearchRequestDto: CreateRecentSearchRequestDto
  ): Promise<RecentSearchResponseDto> {
    const { target, keyword } = createRecentSearchRequestDto;
    const recentSearch = await this._commandBus.execute<
      CreateRecentSearchCommand,
      CreateRecentSearchDto
    >(new CreateRecentSearchCommand({ target, keyword, userId: user.id }));
    return this._classTransformer.plainToInstance(RecentSearchResponseDto, recentSearch, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete recent search' })
  @ApiOkResponse({
    description: 'Delete recent search successfully',
  })
  @Delete('/:id/delete')
  public async deleteRecentSearch(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<boolean> {
    await this._commandBus.execute(new DeleteRecentSearchCommand({ id }));
    return true;
  }

  @ApiOperation({ summary: 'Clean recent search' })
  @ApiOkResponse({
    description: 'Clean recent search successfully',
  })
  @Delete('/:target/clean')
  public async cleanRecentSearch(
    @AuthUser() user: UserDto,
    @Param() cleanRecentSearchesDto: CleanRecentSearchesDto
  ): Promise<boolean> {
    await this._commandBus.execute(new DeleteRecentSearchCommand(cleanRecentSearchesDto));
    return true;
  }
}
