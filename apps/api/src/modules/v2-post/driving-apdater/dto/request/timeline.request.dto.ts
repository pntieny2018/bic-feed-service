import { CONTENT_TYPE } from '@beincom/constants';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, ValidateIf } from 'class-validator';

import { PaginatedArgs } from '../../../../../common/dto';

export class GetTimelineRequestDto extends PaginatedArgs {
  @ApiProperty({ name: 'is_important', example: true })
  @IsOptional()
  @Expose({
    name: 'is_important',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return null;
  })
  public isImportant?: boolean;

  @ApiProperty({ name: 'is_mine', example: false })
  @IsOptional()
  @Expose({
    name: 'is_mine',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return null;
  })
  public isMine?: boolean;

  @ApiProperty({ name: 'is_saved', example: true })
  @IsOptional()
  @Expose({
    name: 'is_saved',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return null;
  })
  public isSaved?: boolean;

  @ApiProperty({
    description: 'Type',
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
