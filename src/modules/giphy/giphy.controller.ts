import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { TrendingDto } from './dto/requests/trending.dto';
import { map } from 'rxjs';
import { SearchDto } from './dto/requests/search.dto';


@ApiTags('Giphy')
@Controller({
  version: APP_VERSION,
  path: 'giphy',
})


export class GiphyController {
  public constructor(private readonly _httpService: HttpService) {}

  @ApiOperation({ summary: 'Get trending Gif.' })
  @Get('/trending')
  public async getTrending(
    @Query() trendingDto: TrendingDto
  ): Promise<any> {
    const trendingGiphyUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${process.env.GIPHY_API_KEY}&limit=${trendingDto.limit}&rating=${trendingDto.rating}`;
    return this._httpService.get(trendingGiphyUrl).pipe(
      map(response => response.data.data)
    );
  };

  @ApiOperation({ summary: 'Search Gif.' })
  @Get('/search')
  public async search(
    @Query() searchDto: SearchDto
  ): Promise<any> {
    const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${searchDto.q}&limit=${searchDto.limit}&offset=${searchDto.offset}&rating=${searchDto.rating}&lang=${searchDto.lang}`;
    return this._httpService.get(giphyUrl).pipe(
      map(response => response.data.data)
    );
  };
}

