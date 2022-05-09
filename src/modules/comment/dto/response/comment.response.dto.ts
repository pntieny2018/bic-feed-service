import { ApiProperty } from '@nestjs/swagger';
import { UserMentionDto } from '../../../mention/dto';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { MediaFilterResponseDto } from '../../../media/dto/response';
import { UserDataShareDto } from '../../../../shared/user/dto';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { MediaService } from '../../../media';
import { IPost } from '../../../../database/models/post.model';
import { PageDto } from '../../../../common/dto';

export class CommentResponseDto {
  @ApiProperty()
  @Expose()
  public id: number;

  @ApiProperty()
  @Expose()
  public actor: UserDataShareDto;

  @ApiProperty()
  @Expose()
  public edited?: boolean;

  @ApiProperty()
  @Expose()
  public parentId: number;

  @ApiProperty()
  @Expose()
  public parent?: CommentResponseDto;

  @ApiProperty()
  @Expose()
  public postId: number;

  @ApiProperty()
  @Expose()
  public post?: IPost;

  @ApiProperty()
  @Expose()
  public totalReply = 0;

  @ApiProperty()
  @Expose()
  public content?: string;

  @ApiProperty()
  @Expose()
  public createdAt?: Date;

  @ApiProperty()
  @Expose()
  public updatedAt?: Date;

  @ApiProperty()
  @Expose()
  public createdBy?: number;

  @ApiProperty({
    type: MediaFilterResponseDto,
  })
  @Transform(({ value }) => {
    if (value && value.length) {
      return MediaService.filterMediaType(value);
    }
    if (
      typeof value === 'object' &&
      value.hasOwnProperty('files') &&
      value.hasOwnProperty('images') &&
      value.hasOwnProperty('videos')
    ) {
      return value;
    }
    return new MediaFilterResponseDto([], [], []);
  })
  @Expose()
  public media?: MediaFilterResponseDto;

  @ApiProperty({
    type: [ReactionResponseDto],
  })
  @Expose()
  public ownerReactions: ReactionResponseDto[] = [];

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
    },
  })
  @Transform(({ value }) => {
    if (value && value !== '1=' && typeof value === 'string') {
      const rawReactionsCount: string = (value as string).substring(1);
      const [s1, s2] = rawReactionsCount.split('=');
      const reactionsName = s1.split(',');
      const total = s2.split(',');
      const reactionsCount = {};
      reactionsName.forEach((v, i) => (reactionsCount[i] = { [v]: parseInt(total[i]) }));
      return reactionsCount;
    }
    if (value === '1=') {
      return null;
    }
    if (Array.isArray(value)) {
      const reactionsCount = {};
      value.forEach((v, i) => (reactionsCount[i] = { [v.reactionName]: parseInt(v.total) }));
      return reactionsCount;
    }
    return value;
  })
  @Expose()
  public reactionsCount?: Record<string, Record<string, number>>;

  @ApiProperty({
    type: UserMentionDto,
    additionalProperties: {
      type: 'object',
    },
  })
  @Expose()
  public mentions?: UserMentionDto;

  @ApiProperty({
    type: [CommentResponseDto],
  })
  @Type(() => CommentResponseDto)
  @Transform(({ value }) => plainToInstance(CommentResponseDto, value))
  @Expose()
  public child?: CommentResponseDto[] | PageDto<CommentResponseDto>;

  public constructor(data: Partial<CommentResponseDto>) {
    Object.assign(this, data);
  }
}
