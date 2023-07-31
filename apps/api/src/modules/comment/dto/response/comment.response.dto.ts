import { ApiProperty } from '@nestjs/swagger';
import { UserMentionDto } from '../../../mention/dto';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { MediaFilterResponseDto } from '../../../media/dto/response';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { IPost } from '../../../../database/models/post.model';
import { PageDto } from '../../../../common/dto';
import { IsUUID } from 'class-validator';
import { UserDto } from '../../../v2-user/application';

export class CommentResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty()
  @Expose()
  public actor: UserDto;

  @ApiProperty()
  @Expose()
  public edited = false;

  @ApiProperty({
    name: 'parent_id',
  })
  @IsUUID()
  @Expose()
  public parentId: string;

  @ApiProperty()
  @Expose()
  public parent?: CommentResponseDto;

  @ApiProperty({
    name: 'post_id',
  })
  @IsUUID()
  @Expose()
  public postId: string;

  @ApiProperty()
  @Expose()
  public post?: IPost;

  @ApiProperty({
    name: 'total_reply',
  })
  @Expose()
  public totalReply = 0;

  @ApiProperty()
  @Expose()
  public content?: string;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public giphyId?: string;

  @ApiProperty()
  @Expose()
  public giphyUrl?: string;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public createdAt?: Date;

  @ApiProperty({
    name: 'updated_at',
  })
  @Expose()
  public updatedAt?: Date;

  @ApiProperty({
    name: 'created_by',
  })
  @Expose()
  public createdBy?: string;

  @ApiProperty({
    description: 'Array of files, images, videos',
    type: MediaFilterResponseDto,
  })
  @Expose()
  @Transform(({ value }) => {
    if (!value) {
      return {
        files: [],
        videos: [],
        images: [],
      };
    }
    return value;
  })
  public media?: MediaFilterResponseDto;

  @ApiProperty({
    type: [ReactionResponseDto],
    name: 'owner_reactions',
  })
  @Expose()
  public ownerReactions: ReactionResponseDto[] = [];

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
    },
    name: 'reactions_count',
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
  public reactionsCount?: Record<string, number>[] | Record<string, Record<string, number>>;

  @ApiProperty({
    type: UserMentionDto,
    additionalProperties: {
      type: 'object',
    },
  })
  @Expose()
  @Transform(({ obj, value }) => {
    const mentions = obj.mentions;
    if (Array.isArray(mentions) && mentions.length === 0) {
      return [];
    }
    return mentions;
  })
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
