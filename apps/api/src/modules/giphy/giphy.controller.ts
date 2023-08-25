import { SentryService } from '@libs/infra/sentry';
import { HttpService } from '@nestjs/axios';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../common/constants';

import { TrendingDto } from './dto/requests';
import { SearchDto } from './dto/requests/search.dto';
import { GiphyResponseDto } from './dto/responses/giphy-response.dto';
import { DEFAULT_REQUEST_TIME_OUT } from './giphy.constants';
import { getGiphyDetailInfo, GifType } from './giphy.util';

@ApiTags('Giphy')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'giphy',
})
export class GiphyController {
  public constructor(
    private readonly _httpService: HttpService,
    private readonly _sentryService: SentryService
  ) {}

  public transferGiphyResponseApi(response, gifType: GifType): GiphyResponseDto[] {
    return response.data.data.map((e) => {
      const details = getGiphyDetailInfo(e.id, gifType, e.images);
      return new GiphyResponseDto(
        e.id,
        e.type,
        details.url,
        details.height,
        details.width,
        details.size
      );
    });
  }

  @ApiOperation({ summary: 'Get trending Gif.' })
  @Get('/trending')
  public async getTrending(@Query() trendingDto: TrendingDto): Promise<GiphyResponseDto[]> {
    const trendingGiphyUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${process.env.GIPHY_API_KEY}&limit=${trendingDto.limit}&rating=${trendingDto.rating}`;
    return this._httpService.axiosRef
      .get(trendingGiphyUrl, { baseURL: '', timeout: DEFAULT_REQUEST_TIME_OUT })
      .then((response) => this.transferGiphyResponseApi(response, trendingDto.type))
      .catch((e) => {
        this._sentryService.captureException(e);
        throw e;
      });
  }

  @ApiOperation({ summary: 'Search Gif.' })
  @Get('/search')
  public async search(@Query() searchDto: SearchDto): Promise<GiphyResponseDto[]> {
    const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${searchDto.q}&limit=${searchDto.limit}&offset=${searchDto.offset}&rating=${searchDto.rating}&lang=${searchDto.lang}`;
    return this._httpService.axiosRef
      .get(giphyUrl, { baseURL: '', timeout: DEFAULT_REQUEST_TIME_OUT })
      .then((response) => this.transferGiphyResponseApi(response, searchDto.type))
      .catch((e) => {
        this._sentryService.captureException(e);
        throw e;
      });
  }
}
