import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReactionResponseDto {
  @ApiProperty()
  @Expose()
  public id: number;

  @ApiProperty()
  @Expose()
  public reactionName: string;

  @ApiProperty()
  @Expose()
  public createdBy: number;

  @ApiProperty()
  @Expose()
  public createdAt: Date;
}
