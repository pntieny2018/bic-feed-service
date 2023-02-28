import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ReactionResponseDto } from './reaction-response.dto';

export class ReactionsResponseDto {
  @ApiProperty()
  public list: ReactionResponseDto[];

  @ApiProperty({
    name: 'latest_id',
  })
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

  public constructor(data: Partial<ReactionsResponseDto>) {
    Object.assign(this, data);
  }
}
