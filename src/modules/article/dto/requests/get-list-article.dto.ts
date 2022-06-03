import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PageOptionsDto } from '../../../../common/dto';
export enum OrderField {
  VIEWS = 'views',
  CREATED_AT = 'createdAt',
}
export class GetListArticlesDto extends PageOptionsDto {
  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  public categories: string[] = [];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public series?: string[] = [];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public hashtags?: string[] = [];

  @ApiProperty({ name: 'group_id', example: 9 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Expose({
    name: 'group_id',
  })
  public groupId: number;

  @ApiProperty({ enum: OrderField, default: OrderField.CREATED_AT, required: true })
  @IsEnum(OrderField)
  @IsOptional()
  @Expose({
    name: 'order_field',
  })
  public orderField?: OrderField = OrderField.CREATED_AT;
}
