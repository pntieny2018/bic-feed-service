import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateReactionDto } from './request';

export class ReactionDto extends CreateReactionDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  public userId: number;

  public constructor(createReactionDto: CreateReactionDto, userId: number) {
    super(createReactionDto);
    this.userId = userId;
  }
}
