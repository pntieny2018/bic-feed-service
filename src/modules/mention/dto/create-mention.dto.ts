import { ApiProperty } from '@nestjs/swagger';

export class CreateMentionDto {
  @ApiProperty({
    required: false,
    type: [Number],
  })
  public userIds: number[];
}
