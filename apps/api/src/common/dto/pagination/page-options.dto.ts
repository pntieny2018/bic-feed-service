import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PAGING_DEFAULT_LIMIT } from '../../constants';

export enum OrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}
export class PageOptionsDto {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  @IsOptional()
  public order?: OrderEnum = OrderEnum.DESC;

  @ApiProperty({
    minimum: 1,
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Max(PAGING_DEFAULT_LIMIT)
  @Min(1)
  @IsOptional()
  public limit?: number = 25;

  @ApiProperty({
    minimum: 0,
    default: 0,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  public offset?: number = 0;

  @ApiProperty({
    required: false,
    name: 'id_gte',
  })
  @IsOptional()
  @Expose({
    name: 'id_gte',
  })
  public idGTE?: string = undefined;

  @ApiProperty({
    required: false,
    name: 'id_lte',
  })
  @IsOptional()
  @Expose({
    name: 'id_lte',
  })
  public idLTE?: string = undefined;

  @ApiProperty({
    required: false,
    name: 'id_gt',
  })
  @IsOptional()
  @Expose({
    name: 'id_gt',
  })
  public idGT?: string = undefined;

  @ApiProperty({
    required: false,
    name: 'id_lt',
  })
  @IsOptional()
  @Expose({
    name: 'id_lt',
  })
  public idLT?: string = undefined;

  @ApiProperty({
    required: false,
    name: 'created_at_gt',
  })
  @IsOptional()
  @Expose({
    name: 'created_at_gt',
  })
  public createdAtGT?: string = undefined;

  @ApiProperty({
    required: false,
    name: 'created_at_lt',
  })
  @IsOptional()
  @Expose({
    name: 'created_at_lt',
  })
  public createdAtLT?: string = undefined;

  @ApiProperty({
    required: false,
    name: 'created_at_gte',
  })
  @IsOptional()
  @Expose({
    name: 'created_at_gte',
  })
  public createdAtGTE?: string = undefined;

  @ApiProperty({
    required: false,
    name: 'created_at_lte',
  })
  @IsOptional()
  @Expose({
    name: 'created_at_lte',
  })
  public createdAtLTE?: string = undefined;
}
