import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderEnum, PageOptionsDto } from '../../../../common/dto';
import { Type } from 'class-transformer';

export class GetCommentsDto extends PageOptionsDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  public postId: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  public parentId?: number = undefined;

  @ApiProperty({
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  public childLimit?: number = 10;

  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  @IsOptional()
  public childOrder?: OrderEnum = OrderEnum.DESC;
}
