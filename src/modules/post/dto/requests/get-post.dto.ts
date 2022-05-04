import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderEnum } from '../../../../common/dto';
import { Type } from 'class-transformer';

export class GetPostDto {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.ASC, required: false })
  @IsEnum(OrderEnum)
  @IsOptional()
  public commentOrder?: OrderEnum = OrderEnum.DESC;

  @ApiProperty({ enum: OrderEnum, default: OrderEnum.ASC, required: false })
  @IsEnum(OrderEnum)
  @IsOptional()
  public childCommentOrder?: OrderEnum = OrderEnum.DESC;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  public commentLimit?: number = 10;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  public childCommentLimit?: number = 10;

  @ApiProperty({
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  public offset?: number = 0;

  public constructor(data: Partial<GetPostDto> = {}) {
    Object.assign(this, data);
  }
}
