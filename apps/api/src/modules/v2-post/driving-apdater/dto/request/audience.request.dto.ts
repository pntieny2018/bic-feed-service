import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AudienceRequestDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'Array of group',
    name: 'group_ids',
  })
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  @Expose({
    name: 'group_ids',
  })
  @Transform((data) => {
    if (!data.obj.group_ids && data.obj.groupIds) {
      return data.obj.groupIds;
    }
    return data.obj.group_ids;
  })
  public groupIds: string[];
}
