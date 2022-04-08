import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from './page-meta.dto';
import { Expose } from 'class-transformer';

export class PageDto<T> {
  @IsArray()
  @ApiProperty({ isArray: true })
  @Expose()
  public list: T[];

  @ApiProperty({ type: () => PageMetaDto })
  @Expose()
  public meta: PageMetaDto;

  public constructor(data: T[], meta: PageMetaDto) {
    this.list = data;
    this.meta = meta;
  }
}
