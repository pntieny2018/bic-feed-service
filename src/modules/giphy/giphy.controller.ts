import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { TrendingDto } from './dto/requests';
import { SearchDto } from './dto/requests/search.dto';
import { GiphyResponseDto } from './dto/responses/giphy-response.dto';
import { getGiphyDetailInfo, GiphyType } from './giphy.util';
import { DEFAULT_REQUEST_TIME_OUT } from './giphy.constants';
import { SentryService } from '@app/sentry';

@ApiTags('Giphy')
@Controller({
  version: APP_VERSION,
  path: 'giphy',
})
export class GiphyController {
  public constructor(
    private readonly _httpService: HttpService,
    private readonly _sentryService: SentryService
  ) {}

  public transferGiphyResponseApi(response): GiphyResponseDto[] {
    return response.data.data.map((e) => {
      const details = getGiphyDetailInfo(e.id, GiphyType.GIF_PREVIEW, e.images);
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
      .get(trendingGiphyUrl, { timeout: DEFAULT_REQUEST_TIME_OUT })
      .then((response) => this.transferGiphyResponseApi(response))
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
      .get(giphyUrl, { timeout: DEFAULT_REQUEST_TIME_OUT })
      .then((response) => this.transferGiphyResponseApi(response))
      .catch((e) => {
        this._sentryService.captureException(e);
        throw e;
      });
  }
}
