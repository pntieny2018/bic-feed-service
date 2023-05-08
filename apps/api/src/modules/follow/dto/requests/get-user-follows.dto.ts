import { IsOptional, IsUUID } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserFollowsDto {
  @ApiProperty({
    description: 'user will be ignore to collection',
    type: [String],
    required: false,
    name: 'ignore_user_ids',
  })
  @Type(() => Array)
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value;
  })
  @Expose({
    name: 'ignore_user_ids',
  })
  public ignoreUserIds: string[] = ['00000000-0000-0000-0000-000000000000'];

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
  public groupIds: string[];

  @ApiProperty({
    type: [String],
    required: false,
    name: 'old_group_ids',
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
    name: 'old_group_ids',
  })
  @IsOptional()
  public oldGroupIds?: string[];

  @ApiProperty({
    name: 'follow_id',
    default: 0,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @Expose({
    name: 'follow_id',
  })
  public followId = 0;

  @ApiProperty({
    name: 'limit',
    default: 100,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  public limit = 100;
}
