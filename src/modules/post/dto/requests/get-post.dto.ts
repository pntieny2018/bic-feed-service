import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderEnum } from '../../../../common/dto';
import { Expose, Transform, Type } from 'class-transformer';

export class GetPostDto {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.ASC, required: false, name: 'comment_order' })
  @IsEnum(OrderEnum)
  @IsOptional()
  @Expose({
    name: 'comment_order',
  })
  public commentOrder?: OrderEnum = OrderEnum.DESC;

  @ApiProperty({
    enum: OrderEnum,
    default: OrderEnum.ASC,
    required: false,
    name: 'child_comment_order',
  })
  @IsEnum(OrderEnum)
  @IsOptional()
  @Expose({
    name: 'child_comment_order',
  })
  public childCommentOrder?: OrderEnum = OrderEnum.DESC;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
    name: 'comment_limit',
  })
  @IsOptional()
  @Type(() => Number)
  @Expose({
    name: 'comment_limit',
  })
  public commentLimit?: number = 10;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
    name: 'child_comment_limit',
  })
  @IsOptional()
  @Type(() => Number)
  @Expose({
    name: 'child_comment_limit',
  })
  public childCommentLimit?: number = 10;

  @ApiProperty({
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  public offset?: number = 0;

  @ApiProperty({
    required: false,
    type: Boolean,
    name: 'with_comment',
  })
  @IsOptional()
  @Transform(({ value }) => value == 'true')
  @Expose({
    name: 'with_comment',
  })
  public withComment?: boolean = false;

  public constructor(data: Partial<GetPostDto> = {}) {
    Object.assign(this, data);
  }
}
