import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PAGING_DEFAULT_LIMIT } from '../../constants';

export enum OrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}
export class PageOptionsDto {
  @ApiPropertyOptional({ enum: OrderEnum, default: OrderEnum.ASC })
  @IsEnum(OrderEnum)
  @IsOptional()
  public order?: OrderEnum = OrderEnum.ASC;

  @ApiPropertyOptional({
    minimum: 1,
    default: 25,
  })
  @Type(() => Number)
  @IsInt()
  @Max(PAGING_DEFAULT_LIMIT)
  @Min(1)
  @IsOptional()
  public limit?: number = 25;

  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  public offset?: number = 0;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  public idGTE?: number = 0;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  public idLTE?: number = 0;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  public idGT?: number = 0;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  public idLT?: number = 0;
}
