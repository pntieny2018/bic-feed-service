import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class AudienceRequestDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'Array of group',
    name: 'group_ids',
  })
  @IsNotEmpty()
  @IsArray()
  @Expose({
    name: 'group_ids',
  })
  public groupIds: string[];
}
