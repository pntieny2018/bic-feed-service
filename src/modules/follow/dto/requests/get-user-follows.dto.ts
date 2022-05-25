import { IsNumberString } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserFollowsDto {
  @ApiProperty({
    description: 'user will be ignore to collection',
    type: [Number],
    required: false,
    name: 'ignore_user_ids',
  })
  @IsNumberString({}, { each: true })
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
  public ignoreUserIds: number[] = [0];

  @ApiProperty({
    type: [Number],
    name: 'group_ids',
  })
  @Type(() => Array)
  @IsNumberString({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value;
  })
  @Expose({
    name: 'group_ids',
  })
  public groupIds: number[];

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
