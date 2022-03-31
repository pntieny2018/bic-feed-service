import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { UserSharedDto } from '../../../shared/user/dto';
import { CreateReactionDto } from './request';

export class ReactionDto extends CreateReactionDto {
  @IsNotEmpty()
  @Expose()
  public userSharedDto: UserSharedDto;

  public constructor(createReactionDto: CreateReactionDto, userSharedDto: UserSharedDto) {
    super(createReactionDto);
    this.userSharedDto = userSharedDto;
  }
}
