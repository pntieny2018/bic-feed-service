import { ApiProperty } from '@nestjs/swagger';

export class ReactionResponseDto {
  @ApiProperty()
  public id: number;

  @ApiProperty()
  public reactionName: number;

  @ApiProperty()
  public userId: number;

  @ApiProperty()
  public commentId: number;

  @ApiProperty()
  public createdBy: number;

  @ApiProperty()
  public createdAt: Date;
}
