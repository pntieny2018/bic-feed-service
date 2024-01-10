import {
  IPaginatedInfo,
  IPaginatedResponse,
  IPaginationArgs,
} from '@libs/database/postgres/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_ITEMS_PER_PAGE } from '@api/common/constants';

export const PAGING_DEFAULT_LIMIT = 10;

export class PaginatedArgs implements IPaginationArgs {
  @ApiProperty({
    minimum: 1,
    default: PAGING_DEFAULT_LIMIT,
    required: false,
  })
  @IsOptional()
  @Max(MAX_ITEMS_PER_PAGE)
  @Expose({
    name: 'limit',
  })
  @Transform((value) => value?.value || PAGING_DEFAULT_LIMIT)
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
