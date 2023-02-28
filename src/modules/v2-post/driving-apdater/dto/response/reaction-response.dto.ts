import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../../../v2-user/application';

export class ReactionResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public reactionName: string;

  @ApiProperty()
  public actor: UserDto;

  @ApiProperty()
  public createdAt: Date;

  public constructor(data: Partial<ReactionResponseDto>) {
    Object.assign(this, data);
  }
}
