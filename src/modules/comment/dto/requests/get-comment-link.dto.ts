import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
  })
  @IsOptional()
  @Type(() => Number)
  public childLimit?: number = 10;

  @ApiProperty({
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  public targetChildLimit?: number = 10;
}
