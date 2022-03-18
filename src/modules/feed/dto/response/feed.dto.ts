import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsNotEmptyObject } from 'class-validator';
import { PostResponseDto } from './post.dto';

export class FeedDto {
  @ApiProperty({ name: 'next' })
  @IsNotEmptyObject()
  @Expose()
  public next: { offset: number; limit: number };

  @ApiProperty({ name: 'results' })
  @IsArray()
  @Expose()
  public results: any[]; //PostResponseDto[];
}
