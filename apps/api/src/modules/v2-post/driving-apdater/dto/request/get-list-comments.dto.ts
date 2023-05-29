import { NIL } from 'uuid';
import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderEnum, PaginatedArgs } from '../../../../../common/dto';
import { IsEnum, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class GetListCommentsDto extends PaginatedArgs {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  public order: OrderEnum = OrderEnum.DESC;

  @ApiPropertyOptional({
    required: false,
    name: 'created_at_gt',
  })
  @IsOptional()
  @Expose({
    name: 'created_at_gt',
  })
  public createdAtGT?: string;

  @ApiPropertyOptional({
    required: false,
    name: 'created_at_lt',
  })
  @IsOptional()
  @Expose({
    name: 'created_at_lt',
  })
  public createdAtLT?: string;

  @ApiPropertyOptional({
    required: false,
    name: 'created_at_gte',
  })
  @IsOptional()
  @Expose({
    name: 'created_at_gte',
  })
  public createdAtGTE?: string;

  @ApiPropertyOptional({
    required: false,
    name: 'created_at_lte',
  })
  @IsOptional()
  @Expose({
    name: 'created_at_lte',
  })
  public createdAtLTE?: string;

  @ApiProperty({
    required: true,
    name: 'post_id',
  })
  @IsUUID()
  @IsNotEmpty()
  @Expose({
    name: 'post_id',
  })
  public postId: string;

  @ApiPropertyOptional({
    required: false,
    name: 'parent_id',
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'parent_id',
  })
  public parentId: string = NIL;
}
