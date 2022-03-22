import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
export class ReactionCountDto {
  @ApiProperty({ type: String, default: true, description: 'smile' })
  @Expose()
  public reactionname: string;

  @ApiProperty({ type: String, default: true, description: 'smile' })
  @Expose()
  public count: number;
}
