import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserDataShareDto } from '../../../../shared/user/dto';

@Exclude()
export class ReactionResponseDto {
  @ApiProperty()
  @Expose()
  public id: number;

  @ApiProperty()
  @Expose()
  public reactionName: string;

  @ApiProperty()
  @Expose()
  public actor: UserDataShareDto = null;

  @ApiProperty()
  @Expose()
  public createdAt: Date;

  public constructor(id: number, reactionName: string, actor: UserDataShareDto, createdAt: Date) {
    this.id = id;
    this.reactionName = reactionName;
    this.actor = actor;
    this.createdAt = createdAt;
  }
}
