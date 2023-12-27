import { UserDto } from '@libs/service/user';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

@Exclude()
export class ReactionResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty({
    name: 'reaction_name',
  })
  @Expose()
  public reactionName: string;

  @ApiProperty()
  @Expose()
  public actor?: UserDto = null;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public createdAt: Date;

  public constructor(id: string, reactionName: string, actor: UserDto, createdAt: Date) {
    this.id = id;
    this.reactionName = reactionName;
    this.actor = actor;
    this.createdAt = createdAt;
  }
}
