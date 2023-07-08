import { Expose, Transform } from 'class-transformer';
import { PostType } from '../../../data-type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderEnum, PaginatedArgs } from '../../../../../common/dto';
import { IsBoolean, IsEnum, IsOptional, ValidateIf } from 'class-validator';

export class GetDraftContentsRequestDto extends PaginatedArgs {
  @ApiProperty({
    enum: OrderEnum,
    default: OrderEnum.DESC,
    required: false,
  })
  @IsEnum(OrderEnum)
  public order: OrderEnum = OrderEnum.DESC;

  @ApiPropertyOptional({
    name: 'is_processing',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_processing' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  public isProcessing?: boolean;

  @ApiProperty({
    description: 'Content type',
    required: false,
    default: '',
    enum: PostType,
  })
  @Expose()
  @IsOptional()
  @IsEnum(PostType)
  @ValidateIf((i) => i.type !== '')
  public type?: PostType;
}
