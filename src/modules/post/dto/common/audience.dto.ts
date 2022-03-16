import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional } from 'class-validator';

export class AudienceDto {
  @ApiProperty({ default: [], type: Number, isArray: true, description: 'Array of  user_id' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  public users?: number[] = [];

  @ApiProperty({ default: [1], type: Number, isArray: true, description: 'Array of group_id' })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @Type(() => Number)
  public groups: number[];
}
