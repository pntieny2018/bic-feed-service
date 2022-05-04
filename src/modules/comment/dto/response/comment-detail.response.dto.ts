import { ApiProperty } from '@nestjs/swagger';
import { UserMentionDto } from '../../../mention/dto';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { MediaFilterResponseDto } from '../../../media/dto/response';
import { UserDataShareDto } from '../../../../shared/user/dto';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { MediaService } from '../../../media';
import { CommentResponseDto } from '.';
import { PageDto } from '../../../../common/dto';

export class CommentDetailResponseDto {
  @ApiProperty()
  @Expose()
  public comment: CommentResponseDto;

  @ApiProperty()
  @Expose()
  public childs: PageDto<CommentResponseDto>;

  public constructor(data: Partial<CommentResponseDto>) {
    Object.assign(this, data);
  }
}
