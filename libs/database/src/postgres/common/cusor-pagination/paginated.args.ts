import {
  IPaginatedInfo,
  IPaginatedResponse,
  IPaginationArgs,
} from '@libs/database/postgres/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

export const PAGING_DEFAULT_LIMIT = 10;

export class PaginatedArgs implements IPaginationArgs {
  @ApiProperty({
    minimum: 1,
    default: PAGING_DEFAULT_LIMIT,
    required: false,
  })
  @IsOptional()
  @Expose({
    name: 'limit',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public limit = PAGING_DEFAULT_LIMIT;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose({
    name: 'before',
  })
  public before?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose({
    name: 'after',
  })
  public after?: string;
}

export class PaginatedInfo implements IPaginatedInfo {
  @IsOptional()
  @ApiPropertyOptional()
  public total?: number;

  @ApiProperty()
  @IsOptional()
  public startCursor?: string;

  @ApiProperty()
  @IsOptional()
  public endCursor?: string;

  @ApiProperty()
  @IsOptional()
  public hasPreviousPage?: boolean = false;

  @ApiProperty()
  @IsOptional()
  public hasNextPage?: boolean = false;
}

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
