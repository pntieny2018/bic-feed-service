import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../../v2-user/application';
import { REACTION_TARGET } from '../../data-type/reaction-target.enum';

export class ReactionDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public reactionName: string;

  @ApiProperty()
  public targetId: string;

  @ApiProperty()
  public target: REACTION_TARGET;

  @ApiProperty()
  public actor: UserDto;

  @ApiProperty()
  public createdAt: Date;

  public constructor(data: Partial<ReactionDto>) {
    Object.assign(this, data);
  }
}
