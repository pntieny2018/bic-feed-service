import { CONTENT_TYPE } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { BooleanHelper } from '@libs/common/helpers';

export class GetTimelineRequestDto extends PaginatedArgs {
  @ApiProperty({ name: 'is_important', example: true })
  @IsOptional()
  @Expose({
    name: 'is_important',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    return BooleanHelper.convertStringToBoolean(value);
  })
  public isImportant?: boolean;

  @ApiProperty({ name: 'is_mine', example: false })
  @IsOptional()
  @Expose({
    name: 'is_mine',
  })
  @Transform(({ value }) => {
    return BooleanHelper.convertStringToBoolean(value);
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
    return BooleanHelper.convertStringToBoolean(value);
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
