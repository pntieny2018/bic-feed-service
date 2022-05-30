import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {Expose, Type} from 'class-transformer';

export const OrderFields = ['updatedAt', 'totalArticle', 'totalView']

export class GetSeriesDto {
  @ApiProperty({
    required: false,
    description: 'sort by updatedAt || updatedAt || updatedAt',
    type: String,
    name: 'order_field',
  })
  @IsOptional()
  @Expose({
    name: 'order_field',
  })
  public orderField?: string;


  @ApiProperty({ required: false })
  @IsOptional()
  public name?: string;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  public limit?: number = 10;

  @ApiProperty({
    required: false,
    type: Number,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  public offset?: number = 0;

  public constructor(data: Partial<GetSeriesDto> = {}) {
    Object.assign(this, data);
  }
}
