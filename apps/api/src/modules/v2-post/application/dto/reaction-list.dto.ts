import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ReactionDto } from '../../../reaction/dto/reaction.dto';

export class ReactionListDto {
  @ApiProperty()
  public list: ReactionDto[];

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

  public constructor(data: Partial<ReactionListDto>) {
    Object.assign(this, data);
  }
}
