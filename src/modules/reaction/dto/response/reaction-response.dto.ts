import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserDataShareDto } from '../../../../shared/user/dto';

export class ReactionResponseDto {
  @ApiProperty()
  @Expose()
  public id: number;

  @ApiProperty()
  @Expose()
  public reactionName: string;

  @ApiProperty()
  @Exclude()
  public createdBy: number;

  @ApiProperty()
  @Expose()
  public actor: UserDataShareDto = null;

  @ApiProperty()
  @Expose()
  public createdAt: Date;
}
