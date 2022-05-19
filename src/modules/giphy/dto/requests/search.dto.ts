import { TrendingDto } from './trending.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDto extends TrendingDto {
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
