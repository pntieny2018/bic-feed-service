import { Expose } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';
import { CreateReactionDto } from './request';

export class ReactionDto extends CreateReactionDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  public userId: number;

  @IsNotEmpty()
  @IsDate()
  @Expose()
  public createdAt?: Date;

  @IsNumber()
  @Expose()
  public reactionId: number;

  public constructor(
    createReactionDto: CreateReactionDto,
    { userId, createdAt, reactionId }: { userId: number; createdAt: Date; reactionId: number }
  ) {
    super(createReactionDto);
    this.userId = userId;
    this.createdAt = createdAt;
    this.reactionId = reactionId;
  }
}
