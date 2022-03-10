import { ApiProperty } from '@nestjs/swagger';

export class Audience {
  @ApiProperty({ default: [], type: Number, isArray: true, description: 'Array of  user_id' })
  public users?: number;

  @ApiProperty({ default: [1], type: Number, isArray: true, description: 'Array of group_id' })
  public groups?: number;
}
