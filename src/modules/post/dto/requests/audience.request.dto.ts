import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional } from 'class-validator';

export class AudienceRequestDto {
  @ApiProperty({
    default: [],
    type: Number,
    required: false,
    isArray: true,
    description: 'Array of user',
  })
  @IsOptional()
  @IsArray()
  public userIds?: number[] = [];

  @ApiProperty({
    type: Number,
    isArray: true,
    description: 'Array of group',
  })
  @IsNotEmpty()
  @ArrayNotEmpty()
  public groupIds: number[];
}
