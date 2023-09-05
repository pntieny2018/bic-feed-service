import { CONTENT_TYPE, ORDER } from '@beincom/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, ValidateIf } from 'class-validator';

import { PaginatedArgs } from '../../../../../common/dto';

export class GetDraftContentsRequestDto extends PaginatedArgs {
  @ApiProperty({
    enum: ORDER,
    default: ORDER.DESC,
    required: false,
  })
  @IsEnum(ORDER)
  public order: ORDER = ORDER.DESC;

  @ApiPropertyOptional({
    name: 'is_processing',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_processing' })
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return null;
  })
  public isProcessing?: boolean;

  @ApiProperty({
    description: 'Content type',
    required: false,
    default: '',
    enum: CONTENT_TYPE,
  })
  @Expose()
  @IsOptional()
  @IsEnum(CONTENT_TYPE)
  @ValidateIf((i) => i.type !== '')
  public type?: CONTENT_TYPE;
}
