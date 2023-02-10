import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { FileResponseDto, ImageResponseDto, UserMentionResponseDto, VideoResponseDto } from '.';
import { PageDto } from '../../../../../common/dto';
import { UserDataShareDto } from '../../../../../shared/user/dto';
import { MediaResponseDto } from './media.response.dto';
import { ReactionResponseDto } from './reaction-response.dto';

export class CommentResponseDto {
  @ApiProperty()
  @IsUUID()
  @Expose()
  public id: string;

  @ApiProperty()
  @Expose()
  public actor: UserDataShareDto;

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
  public postId: string;

  @ApiProperty({
    name: 'total_reply',
  })
  public totalReply = 0;

  @ApiProperty()
  public content?: string;

  @ApiProperty({
    name: 'created_at',
  })
  public giphyId?: string;

  @ApiProperty()
  public giphyUrl?: string;

  @ApiProperty({
    name: 'created_at',
  })
  public createdAt?: Date;

  @ApiProperty({
    name: 'updated_at',
  })
  public updatedAt?: Date;

  @ApiProperty({
    name: 'created_by',
  })
  public createdBy?: string;

  @ApiProperty()
  @Transform(({ value }) => {
    const mediaTypes = {
      files: [],
      videos: [],
      images: [],
    };
    value
      .sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .forEach((media) => {
        const TypeMediaDto =
          media.type === 'file'
            ? FileResponseDto
            : media.type === 'image'
            ? ImageResponseDto
            : VideoResponseDto;
        const typeMediaDto = plainToInstance(TypeMediaDto, media, {
          excludeExtraneousValues: true,
        });
        if (mediaTypes[`${media.type}s`]) mediaTypes[`${media.type}s`].push(typeMediaDto);
      });
    return mediaTypes;
  })
  public media?: MediaResponseDto;

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
  public reactionsCount?: Record<string, Record<string, number>>;

  @ApiProperty({
    type: UserMentionResponseDto,
    additionalProperties: {
      type: 'object',
    },
  })
  @Expose()
  public mentions?: UserMentionResponseDto;

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
