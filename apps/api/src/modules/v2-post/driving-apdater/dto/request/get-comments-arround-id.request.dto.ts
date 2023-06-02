import { IsOptional, Max, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PAGING_DEFAULT_LIMIT } from '../../../../../common/constants';

export class GetCommentsArroundIdDto {
  @ApiPropertyOptional({
    required: false,
    default: 10,
  })
  @IsOptional()
  @Min(1)
  @Max(PAGING_DEFAULT_LIMIT)
  @Type(() => Number)
  public limit?: number = 10;

  @ApiPropertyOptional({
    required: false,
    default: 10,
    name: 'target_child_limit',
  })
  @IsOptional()
  @Min(1)
  @Max(PAGING_DEFAULT_LIMIT)
  @Type(() => Number)
  @Expose({
    name: 'target_child_limit',
  })
  public targetChildLimit?: number;
}
