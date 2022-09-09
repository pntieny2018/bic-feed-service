import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { TrendingDto } from './dto/requests';
import { map, Observable } from 'rxjs';
import { SearchDto } from './dto/requests/search.dto';
import { GiphyResponseDto } from './dto/responses/giphy-response.dto';
import { getGiphyDetailInfo, GiphyType } from './giphy.util';

@ApiTags('Giphy')
@Controller({
  version: APP_VERSION,
  path: 'giphy',
})
export class GiphyController {
  public constructor(private readonly _httpService: HttpService) {}

  public transferGiphyResponseApi(response): GiphyResponseDto[] {
    return response.data.data.map(
      (e) => {
        const details = getGiphyDetailInfo(e.id, GiphyType.GIF_PREVIEW, e.images);
        return new GiphyResponseDto(e.id, e.type, details.url, details.height, details.width, details.size);
      }
    );
  }

  @ApiOperation({ summary: 'Get trending Gif.' })
  @Get('/trending')
  public async getTrending(
    @Query() trendingDto: TrendingDto
  ): Promise<Observable<GiphyResponseDto[]>> {
    const trendingGiphyUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${process.env.GIPHY_API_KEY}&limit=${trendingDto.limit}&rating=${trendingDto.rating}`;
    return this._httpService
      .get(trendingGiphyUrl)
      .pipe(map((response) => this.transferGiphyResponseApi(response)));
  }

  @ApiOperation({ summary: 'Search Gif.' })
  @Get('/search')
  public async search(@Query() searchDto: SearchDto): Promise<Observable<GiphyResponseDto[]>> {
    const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${searchDto.q}&limit=${searchDto.limit}&offset=${searchDto.offset}&rating=${searchDto.rating}&lang=${searchDto.lang}`;
    return this._httpService
      .get(giphyUrl)
      .pipe(map((response) => this.transferGiphyResponseApi(response)));
  }
}
