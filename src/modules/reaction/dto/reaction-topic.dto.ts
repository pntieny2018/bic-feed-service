import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateReactionDto } from './request';

export class CreateReactionTopicDto extends CreateReactionDto {
  @IsNotEmpty()
  @IsNumber()
  public userId: number;

  public constructor(createReactionDto: CreateReactionDto, userId: number) {
    super(createReactionDto);
    this.userId = userId;
  }
}
