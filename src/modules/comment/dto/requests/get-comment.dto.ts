import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { OrderEnum, PageOptionsDto } from '../../../../common/dto';

export class GetCommentDto extends PageOptionsDto {
  @ApiProperty({
    required: false,
    type: Number,
  })
  @IsOptional()
  public parentId?: number = 0;

  @ApiProperty({
    required: false,
    type: Number,
    default: 0,
  })
  public offset?: number = 0;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
  })
  @IsOptional()
  public limit?: number = 10;

  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  public order?: OrderEnum = OrderEnum.DESC;
}
