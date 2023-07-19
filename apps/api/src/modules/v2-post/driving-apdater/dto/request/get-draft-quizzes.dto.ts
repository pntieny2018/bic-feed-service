import { ApiProperty } from '@nestjs/swagger';
import { OrderEnum, PaginatedArgs } from '../../../../../common/dto';
import { IsEnum } from 'class-validator';

export class GetDraftQuizzesDto extends PaginatedArgs {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  public order: OrderEnum = OrderEnum.DESC;
}
