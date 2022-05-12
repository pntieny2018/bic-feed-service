import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderEnum, PageOptionsDto } from '../../../../common/dto';
import { Type } from 'class-transformer';

export class GetCommentsDto extends PageOptionsDto {
  @ApiProperty({
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  public postId: string;

  @ApiProperty({
    required: false,
  })
  @IsUUID()
  @IsOptional()
  public parentId?: string = null;

  @ApiProperty({
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  public childLimit?: number = 10;

  @ApiProperty({
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  public targetChildLimit?: number = 10;

  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  @IsOptional()
  public childOrder?: OrderEnum = OrderEnum.DESC;
}
