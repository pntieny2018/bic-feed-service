import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateMentionDto {
  @ApiProperty({
    required: false,
    type: [Number],
    name: 'user_ids',
  })
  @Expose({
    name: 'user_ids',
  })
  public userIds: number[];
}
