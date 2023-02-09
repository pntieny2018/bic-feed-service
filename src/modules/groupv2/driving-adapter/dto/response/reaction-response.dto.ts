import { ApiProperty } from '@nestjs/swagger';

export class ReactionResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public reactionName: string;

  @ApiProperty()
  public createdBy: string;

  @ApiProperty()
  public createdAt: Date;

  public constructor(data: Partial<ReactionResponseDto>) {
    Object.assign(this, data);
  }
}
