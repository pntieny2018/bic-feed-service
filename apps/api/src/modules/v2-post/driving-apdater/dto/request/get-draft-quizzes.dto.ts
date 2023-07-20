import { ApiProperty } from '@nestjs/swagger';
import { OrderEnum, PaginatedArgs } from '../../../../../common/dto';
import { IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { PostType } from '../../../data-type';
import { Expose } from 'class-transformer';

export class GetDraftQuizzesDto extends PaginatedArgs {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  public order: OrderEnum = OrderEnum.DESC;

  @ApiProperty({
    description: 'Content type',
    required: false,
    enum: PostType,
  })
  @Expose({
    name: 'type',
  })
  @IsOptional()
  @IsEnum(PostType)
  @ValidateIf((i) => i.type !== '')
  public type?: PostType;
}
