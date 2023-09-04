import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PAGING_DEFAULT_LIMIT } from '../../../../../common/constants';
import { GifType, GiphyRating } from '../../../data-type';

export class GetTrendingGifRequestDto {
  @ApiProperty({
    minimum: 1,
    default: 25,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Max(PAGING_DEFAULT_LIMIT)
  @Min(1)
  @IsOptional()
  public limit?: number = 25;

  @ApiProperty({ enum: GiphyRating, default: GiphyRating.g, required: false })
  @IsEnum(GiphyRating)
  @IsOptional()
  public rating?: GiphyRating = GiphyRating.g;

  @ApiProperty({ enum: GifType, default: GifType.PREVIEW_GIF, required: false })
  @IsEnum(GifType)
  @IsOptional()
  public type: GifType = GifType.PREVIEW_GIF;
}
