import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderEnum } from '../../../../common/dto';

export class GetPostDto {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.ASC, required: false })
  @IsEnum(OrderEnum)
  @IsOptional()
  public commentOrder?: OrderEnum = OrderEnum.DESC;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
  })
  @IsOptional()
  public commentLimit?: number = 10;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
  })
  @IsOptional()
  public childCommentLimit?: number = 10;

  public constructor(data: Partial<GetPostDto> = {}) {
    Object.assign(this, data);
  }
}
