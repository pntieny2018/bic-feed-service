import { IsOptional, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCommentsArroundIdDto {
  @ApiPropertyOptional({
    required: false,
    default: 10,
  })
  @IsOptional()
  @Min(3)
  @Type(() => Number)
  public limit?: number = 10;

  @ApiPropertyOptional({
    required: false,
    default: 10,
    name: 'target_child_limit',
  })
  @IsOptional()
  @Min(3)
  @Type(() => Number)
  @Expose({
    name: 'target_child_limit',
  })
  public targetChildLimit?: number;
}
