import { ReactionResponseDto } from './reaction-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReactionsResponseDto {
  @ApiProperty()
  public list: ReactionResponseDto[];

  @ApiProperty()
  @IsUUID()
  public latestId: string;

  @ApiProperty({
    type: Number,
  })
  public limit: number;

  @ApiProperty({
    type: String,
  })
  public order?: string;
}
