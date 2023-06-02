import { NIL } from 'uuid';
import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderEnum, PaginatedArgs } from '../../../../../common/dto';
import { IsEnum, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class GetListCommentsDto extends PaginatedArgs {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  public order: OrderEnum = OrderEnum.DESC;

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
