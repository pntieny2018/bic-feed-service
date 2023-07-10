import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { IPaginationArgs } from './paginated.interface';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PAGING_DEFAULT_LIMIT } from '../../constants';

export class PaginatedArgs implements IPaginationArgs {
  @ApiProperty({
    minimum: 1,
    default: 25,
    required: false,
  })
  @Expose({
    name: 'limit',
  })
  @Type(() => Number)
  @IsInt()
  @Max(PAGING_DEFAULT_LIMIT)
  @Min(1)
  public limit = 10;

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
