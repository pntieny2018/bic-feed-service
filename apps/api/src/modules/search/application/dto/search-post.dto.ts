import { PageOptionsDto } from '@api/common/dto';
import { CONTENT_TYPE } from '@beincom/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class SearchPostsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    type: 'string',
    items: { type: 'integer' },
    description: 'List of user id',
    default: null,
    example: '1,2,3',
  })
  @IsOptional()
  @Transform(({ value }) => value.split(','))
  public actors?: string[];

  @ApiProperty({ description: 'filter content', required: false, name: 'content_search' })
  @IsOptional()
  @IsString()
  @Expose({
    name: 'content_search',
  })
  public contentSearch?: string;

  @ApiProperty({ description: 'search by tag name', required: false, name: 'tag_name' })
  @IsOptional()
  @IsString()
  @Expose({
    name: 'tag_name',
  })
  public tagName?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Important',
    required: false,
    default: null,
  })
  @Transform(({ value }) => value == 'true')
  @IsOptional()
  @IsBoolean()
  public important?: boolean;

  @ApiProperty({
    description: 'filter posts created_time > start_time',
    required: false,
    name: 'start_time',
  })
  @IsOptional()
  @IsDateString()
  @Expose({
    name: 'start_time',
  })
  public startTime?: string;

  @ApiProperty({
    description: 'filter posts created_time < end_time',
    required: false,
    name: 'end_time',
  })
  @IsOptional()
  @IsDateString()
  @Expose({
    name: 'end_time',
  })
  public endTime?: string;

  @ApiProperty({
    description: 'Group ID',
    required: false,
    name: 'group_id',
  })
  @Expose({
    name: 'group_id',
  })
  @Type(() => String)
  @IsUUID()
  @IsOptional()
  public groupId?: string;

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

  @ApiProperty({
    type: Boolean,
    required: false,
    default: false,
    name: 'limit_series',
  })
  @Transform(({ value }) => value == 'true')
  @Expose({
    name: 'limit_series',
  })
  @IsOptional()
  @IsBoolean()
  public limitSeries?: boolean;

  public notIncludeIds?: string[];

  public tagId?: string;
}