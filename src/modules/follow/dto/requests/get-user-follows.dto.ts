import { IsNumberString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserFollowsDto {
  @ApiProperty({
    description: 'user will be ignore to collection',
    type: [Number],
  })
  @IsNumberString({}, { each: true })
  @Type(() => Array)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  public ignoreUserIds: number[];

  @ApiProperty({
    type: [Number],
  })
  @Type(() => Array)
  @IsNumberString({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  public groupIds: number[];

  @ApiProperty({
    name: 'followId',
    default: 0,
    required: false,
    type: Number,
  })
  @Type(() => Number)
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
