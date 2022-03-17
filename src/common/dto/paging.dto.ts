import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { FEED_PAGING_DEFAULT_LIMIT } from 'src/modules/feed/feed.constant';

export class PagingDto {
  @ApiProperty({ required: false, default: 0 })
  @Expose({ name: 'offset' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  public offset?: number = 0;

  @ApiProperty({ required: false, default: 20 })
  @Expose({ name: 'limit' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  public limit?: number = FEED_PAGING_DEFAULT_LIMIT;

  public constructor(pagingDto: PagingDto) {
    Object.assign(this, pagingDto);
  }
}
