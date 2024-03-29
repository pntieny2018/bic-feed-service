import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { PageOptionsDto } from '../../../../common/dto';

export enum OrderField {
  CREATED_AT = 'createdAt',
}

export class GetListArticlesDto extends PageOptionsDto {
  @ApiProperty({
    type: [String],
    required: false,
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  public categories: string[] = [];

  @ApiProperty({
    type: [String],
    required: false,
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public series?: string[] = [];

  @ApiProperty({
    type: [String],
    required: false,
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public hashtags?: string[] = [];

  @ApiProperty({
    type: [String],
    required: false,
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public tags?: string[] = [];

  @ApiProperty({
    type: [Number],
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsUUID()
  @Expose({
    name: 'group_id',
  })
  public groupId?: string;

  public groupIds?: string[];

  @ApiProperty({ enum: OrderField, description: 'Do not order_field if you want to sort randomly' })
  @IsEnum(OrderField)
  @IsOptional()
  @Expose({
    name: 'order_field',
  })
  public orderField?: OrderField;
}
