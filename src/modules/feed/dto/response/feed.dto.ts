import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmptyObject } from 'class-validator';

export class FeedDto {
  @ApiProperty({ name: 'next' })
  @Expose({ name: 'next' })
  @IsNotEmptyObject()
  public next: { offset: number; limit: number };

  @ApiProperty({ name: 'results' })
  @Expose({ name: 'results' })
  public results: any[];
}
