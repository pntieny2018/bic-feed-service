import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Inject, Query } from '@nestjs/common';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { ClassTransformer } from 'class-transformer';
import { GetTrendingGifRequestDto } from '../dto/request/get-trending-gif.request.dto';
import { SearchGifRequestDto } from '../dto/request/search-gif.request.dto';
import { GiphyResponseDto } from '../dto/response/giphy.response.dto';
import {
  GIPHY_APPLICATION_TOKEN,
  IGiphyApplicationService,
} from '../../application/interface/giphy.app-service.interface';

@ApiTags('Giphy')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'giphy',
})
export class GiphyController {
  @Inject(GIPHY_APPLICATION_TOKEN)
  private readonly _giphyAppService: IGiphyApplicationService;
  // public constructor() {}
  private _classTransformer = new ClassTransformer();

  @ApiOperation({ summary: 'Get trending gif' })
  @Get('/trending')
  public async getTrendingGif(
    @Query() getTrendingGifRequestDto: GetTrendingGifRequestDto
  ): Promise<GiphyResponseDto[]> {
    return this._giphyAppService.getTrendingGifs(getTrendingGifRequestDto);
  }

  @ApiOperation({ summary: 'Search gif' })
  @Get('/search')
  public async searchGif(
    @Query() searchGifRequestDto: SearchGifRequestDto
  ): Promise<GiphyResponseDto[]> {
    return this._giphyAppService.searchGifs(searchGifRequestDto);
  }
}
