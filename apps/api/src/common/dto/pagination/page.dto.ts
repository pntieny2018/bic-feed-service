import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray } from 'class-validator';

import { PageMetaDto } from './page-meta.dto';

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
