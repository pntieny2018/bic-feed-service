import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { GetTrendingGifRequestDto } from './get-trending-gif.request.dto';

export class SearchGifRequestDto extends GetTrendingGifRequestDto {
  @ApiProperty({
    minimum: 0,
    default: 0,
    required: true,
  })
  public q: string;

  @ApiProperty({
    minimum: 0,
    default: 0,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  public offset?: number = 0;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  public lang?: string = 'en';
}
