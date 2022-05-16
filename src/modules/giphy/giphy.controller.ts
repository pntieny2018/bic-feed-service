import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { TrendingDto } from './dto/requests/trending.dto';
import { map } from 'rxjs';


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
}

