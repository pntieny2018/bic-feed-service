import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GetItemsBySeriesRequestDto {
  @ApiProperty({
    type: [String],
    name: 'series_ids',
  })
  @Type(() => Array)
  @IsUUID(4, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value;
  })
  @Expose({
    name: 'series_ids',
  })
  @IsNotEmpty()
  public seriesIds: string[];
}
