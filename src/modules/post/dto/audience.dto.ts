import { ApiProperty } from '@nestjs/swagger';

export class Audience {
  @ApiProperty({ default: [], type: [Number], description: 'Array of  user_id' })
  users?: number[];

  @ApiProperty({ default: [1], type: [Number], description: 'Array of group_id' })
  groups?: number[];
}
