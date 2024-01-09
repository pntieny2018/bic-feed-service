import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';

import { PageOptionsDto } from '../../../../../common/dto';
import { RULES } from '../../../constant';

export class UpdateTagRequestDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @MaxLength(RULES.TAG_MAX_NAME)
  @MinLength(RULES.TAG_MIN_NAME)
  public name: string;
}

export class GetTagRequestDto extends PageOptionsDto {
  @ApiProperty({ type: String, required: false })
  @Type(() => String)
  @IsOptional()
  public name?: string;

  @ApiProperty({
    type: [String],
    name: 'group_ids',
  })
  @Type(() => Array)
  @IsUUID(4, { each: true })
  @Expose({
    name: 'group_ids',
  })
  @Transform((data) => {
    let value;
    if (!data.obj.group_ids && data.obj.groupIds) {
      value = data.obj.groupIds;
    } else {
      value = data.obj.group_ids;
    }

    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value;
  })
  @IsOptional()
  public groupIds: string[];
}

export class CreateTagRequestDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(RULES.TAG_MAX_NAME)
  @MinLength(RULES.TAG_MIN_NAME)
  public name: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  @Transform((data) => {
    if (!data.obj.group_id && data.obj.groupId) {
      return data.obj.groupId;
    }
    return data.obj.group_id;
  })
  public groupId: string;

  public constructor(data: CreateTagRequestDto) {
    Object.assign(this, data);
  }
}

export class SearchTagRequestDto {
  @ApiProperty({ description: 'Search tags by keyword', required: true })
  @IsNotEmpty()
  @Type(() => String)
  @MinLength(RULES.TAG_MIN_NAME)
  @Expose({
    name: 'keyword',
  })
  public keyword: string;
}
