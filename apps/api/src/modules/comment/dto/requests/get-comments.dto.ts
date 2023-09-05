import { ORDER } from '@beincom/constants';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { NIL as NIL_UUID } from 'uuid';

import { PageOptionsDto } from '../../../../common/dto';

export class GetCommentsDto extends PageOptionsDto {
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

  @ApiProperty({
    required: false,
    name: 'parent_id',
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'parent_id',
  })
  public parentId?: string = NIL_UUID;

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

  @ApiProperty({
    enum: ORDER,
    default: ORDER.DESC,
    required: false,
    name: 'child_order',
  })
  @IsEnum(ORDER)
  @IsOptional()
  @Expose({
    name: 'child_order',
  })
  public childOrder?: ORDER = ORDER.DESC;
}
