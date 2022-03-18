import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateReactionDto } from './request';

export class ReactionDto extends CreateReactionDto {
  @ApiProperty({ name: 'user_id', example: 9 })
  @IsNotEmpty()
  @IsNumber()
  public userId: number;

  public constructor(createReactionDto: CreateReactionDto, userId: number) {
    super(createReactionDto);
    this.userId = userId;
  }
}
