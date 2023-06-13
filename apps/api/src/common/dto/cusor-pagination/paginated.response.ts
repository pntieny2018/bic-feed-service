import { ApiProperty } from '@nestjs/swagger';
import { IPaginatedResponse } from './paginated.interface';
import { IsArray, IsOptional } from 'class-validator';
import { PaginatedInfo } from './paginated.info';

export class PaginatedResponse<T> implements IPaginatedResponse<T> {
  @IsArray()
  @ApiProperty()
  public list: T[] = [];

  @ApiProperty({ type: () => PaginatedInfo })
  @IsOptional()
  public meta?: PaginatedInfo;

  public constructor(list: T[], meta?: PaginatedInfo) {
    this.meta = meta;
    this.list = list;
  }
}
