import { ApiProperty } from '@nestjs/swagger';
import { PageDto } from '../../../../common/dto';
import { Expose, Transform, Type } from 'class-transformer';
import { UserSharedDto } from '../../../../shared/user/dto';
import { CommentResponseDto } from '../../../comment/dto/response';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { IsUUID } from 'class-validator';
import { AudienceResponseDto } from '../../../post/dto/responses';
export class SeriesResponseDto {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
  @IsUUID()
  @Expose()
  public id: string;

  @Expose()
  public lang?: string;

  @ApiProperty({
    description: 'Highlight',
    type: String,
  })
  @Expose()
  public highlight?: string;

  @ApiProperty({
    description: 'title highlight',
    type: String,
  })
  @Expose()
  public titleHighlight?: string;

  @ApiProperty({
    description: 'summary highlight',
    type: String,
  })
  @Expose()
  public summaryHighlight?: string;

  @ApiProperty({
    description: 'Post creator information',
    type: UserSharedDto,
  })
  @Expose()
  @Type(() => UserSharedDto)
  public actor: UserSharedDto;

  @ApiProperty({
    description: 'Total number of comments',
    type: Number,
    name: 'comments_count',
  })
  @Expose()
  public commentsCount: number;

  @ApiProperty({
    description: 'Total users seen post',
    type: Number,
    name: 'total_users_seen',
  })
  @Expose()
  public totalUsersSeen: number;

  @ApiProperty({
    type: 'object',
    example: {
      [0]: {
        id: 1,
        username: 'dangdiep',
        avatar: 'https://google.com',
        fullname: 'Diep Dang',
      },
      [1]: {
        id: 2,
        username: 'tuine',
        avatar: 'https://google.com',
        fullname: 'Tui Day Ne',
      },
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
    if (Array.isArray(value)) {
      const reactionsCount = {};
      value.forEach((v, i) => (reactionsCount[i] = { [v.reactionName]: parseInt(v.total) }));
      return reactionsCount;
    }
    return null;
  })
  @Expose()
  public reactionsCount?: Record<string, Record<string, number>>;

  @ApiProperty({
    type: Date,
    name: 'created_at',
  })
  @Expose()
  public createdAt: Date;

  @ApiProperty({
    type: Date,
    name: 'updated_at',
  })
  @Expose()
  public updatedAt?: Date;

  @ApiProperty({
    type: Number,
    name: 'created_by',
  })
  @Expose()
  public createdBy: string;

  @ApiProperty({
    type: AudienceResponseDto,
  })
  @Expose()
  public audience: AudienceResponseDto;

  @ApiProperty({
    type: [ReactionResponseDto],
    name: 'owner_reactions',
  })
  @Expose()
  public ownerReactions?: ReactionResponseDto[] = [];

  //@ApiProperty({ type: PageDto<CommentResponseDto>, isArray: true })
  @Expose()
  public comments?: PageDto<CommentResponseDto>;

  public constructor(data: Partial<PostResponseDto>) {
    Object.assign(this, data);
  }
}
