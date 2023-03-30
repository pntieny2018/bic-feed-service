import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PAGING_DEFAULT_LIMIT } from '../../../../../../common/constants';
import { GifType } from '../../../../../giphy/giphy.util';
import { Rating } from '../../../../../giphy/dto/requests';

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

  @ApiProperty({ enum: Rating, default: Rating.g, required: false })
  @IsEnum(Rating)
  @IsOptional()
  public rating?: Rating = Rating.g;

  @ApiProperty({ enum: GifType, default: GifType.PREVIEW_GIF, required: false })
  @IsEnum(GifType)
  @IsOptional()
  public type: GifType = GifType.PREVIEW_GIF;
}
