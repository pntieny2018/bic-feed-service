import { CONTENT_TYPE } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { BooleanHelper } from '@libs/common/helpers';

export class NewsfeedRequestDto extends PaginatedArgs {
  @ApiProperty({ name: 'is_important', example: true })
  @IsOptional()
  @Expose({
    name: 'is_important',
  })
  @IsBoolean()
  @Transform((data) => {
    if (!data.obj.is_important && data.obj.isImportant) {
      return BooleanHelper.convertStringToBoolean(data.obj.isImportant);
    }
    return BooleanHelper.convertStringToBoolean(data.obj.is_important);
  })
  public isImportant?: boolean;

  @ApiProperty({ name: 'is_mine', example: false })
  @IsOptional()
  @Expose({
    name: 'is_mine',
  })
  @IsBoolean()
  @Transform((data) => {
    if (!data.obj.is_mine && data.obj.isMine) {
      return BooleanHelper.convertStringToBoolean(data.obj.isMine);
    }
    return BooleanHelper.convertStringToBoolean(data.obj.is_mine);
  })
  public isMine?: boolean;

  @ApiProperty({ name: 'is_saved', example: true })
  @IsOptional()
  @Expose({
    name: 'is_saved',
  })
  @IsBoolean()
  @Transform((data) => {
    if (!data.obj.is_saved && data.obj.isSaved) {
      return BooleanHelper.convertStringToBoolean(data.obj.isSaved);
    }
    return BooleanHelper.convertStringToBoolean(data.obj.is_saved);
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
