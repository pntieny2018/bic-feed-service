import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class GetCommentLinkDto {
  @ApiProperty({
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  public limit?: number = 10;

  @ApiProperty({
    required: false,
    default: 10,
    name: 'child_limit',
  })
  @IsOptional()
  @Type(() => Number)
  @Expose({
    name: 'child_limit',
  })
  public childLimit?: number = 10;

  @ApiProperty({
    required: false,
    default: 10,
    name: 'target_child_limit',
  })
  @IsOptional()
  @Type(() => Number)
  @Expose({
    name: 'target_child_limit',
  })
  public targetChildLimit?: number = 10;
}
