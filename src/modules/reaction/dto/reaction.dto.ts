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
  public createdAt: Date;

  public constructor(
    createReactionDto: CreateReactionDto,
    { userId, createdAt }: { userId: number; createdAt: Date }
  ) {
    super(createReactionDto);
    this.userId = userId;
    this.createdAt = createdAt;
  }
}
