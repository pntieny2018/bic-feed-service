import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { APP_VERSION } from '../../../../common/constants';
import { ClassTransformer } from 'class-transformer';
import { GetTrendingGifRequestDto } from '../dto/request/giphy/get-trending-gif.request.dto';
import { SearchGifRequestDto } from '../dto/request/giphy/search-gif.request.dto';
import { GiphyResponseDto } from '../dto/response/giphy.response.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@ApiTags('Giphy')
@Controller({
  version: APP_VERSION,
  path: 'giphy',
})
export class GiphyController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}
  private _classTransformer = new ClassTransformer();
  @ApiOperation({ summary: 'Get trending gif' })
  @Get('/trending')
  public async getTrendingGif(
    @Query() getTrendingGifRequestDto: GetTrendingGifRequestDto
  ): Promise<GiphyResponseDto[]> {
    return null;
  }

@ApiOperation({ summary: 'Search gif' })
  @Get('/search')
  public async searchGif(
    @Query() searchGifRequestDto: SearchGifRequestDto
  ): Promise<GiphyResponseDto[]> {
    return null;
  }
}
