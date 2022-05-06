import { ReactionResponseDto } from './reaction-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ReactionsResponseDto {
  @ApiProperty()
  public list: ReactionResponseDto[];

  @ApiProperty()
  public latestId: number;

  @ApiProperty({
    type: Number,
  })
  public limit: number;

  @ApiProperty({
    type: String,
  })
  public order?: string;
}
