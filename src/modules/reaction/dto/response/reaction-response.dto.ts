import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { UserDataShareDto } from '../../../../shared/user/dto';

@Exclude()
export class ReactionResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty()
  @Expose()
  public reactionName: string;

  @ApiProperty()
  @Expose()
  public actor?: UserDataShareDto = null;

  @ApiProperty()
  @Expose()
  public createdAt: Date;

  public constructor(id: string, reactionName: string, actor: UserDataShareDto, createdAt: Date) {
    this.id = id;
    this.reactionName = reactionName;
    this.actor = actor;
    this.createdAt = createdAt;
  }
}
