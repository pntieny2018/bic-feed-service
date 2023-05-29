import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { IPaginationArgs } from './paginated.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PAGING_DEFAULT_LIMIT } from '../../constants';

export class PaginatedArgs implements IPaginationArgs {
  @ApiProperty({
    minimum: 1,
    default: 25,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Max(PAGING_DEFAULT_LIMIT)
  @Min(1)
  public limit = 25;

  @ApiProperty()
  @IsOptional()
  @Expose({
    name: 'previous_cursor',
  })
  public previousCursor?: string;

  @ApiProperty()
  @IsOptional()
  @Expose({
    name: 'next_cursor',
  })
  public nextCursor?: string;
}
