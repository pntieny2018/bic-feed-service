import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class AudienceRequestDto {
  @ApiProperty({
    default: [],
    type: Number,
    required: false,
    isArray: true,
    description: 'Array of user',
    name: 'user_ids',
  })
  @IsOptional()
  @IsArray()
  @Expose({
    name: 'user_ids',
  })
  public userIds?: string[] = [];

  @ApiProperty({
    type: Number,
    isArray: true,
    description: 'Array of group',
    name: 'group_ids',
  })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @Expose({
    name: 'group_ids',
  })
  public groupIds: string[];
}
