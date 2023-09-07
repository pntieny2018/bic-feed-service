import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';

import { PageOptionsDto } from '../../../../../common/dto';

export class UpdateTagRequestDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @MaxLength(32)
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
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value;
  })
  @Expose({
    name: 'group_ids',
  })
  @IsOptional()
  public groupIds: string[];
}

export class CreateTagRequestDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(32)
  public name: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  public groupId: string;

  public constructor(data: CreateTagRequestDto) {
    Object.assign(this, data);
  }
}

const MIN_LENGTH = 3;
export class SearchTagRequestDto {
  @ApiProperty({ description: 'Search tags by keyword', required: true })
  @IsNotEmpty()
  @Type(() => String)
  @MinLength(MIN_LENGTH)
  @Expose({
    name: 'keyword',
  })
  public keyword: string;
}
