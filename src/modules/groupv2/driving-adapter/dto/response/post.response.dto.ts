import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance, Transform } from 'class-transformer';
import { IsUUID } from 'class-validator';
import {
  CommentResponseDto,
  FileResponseDto,
  ImageResponseDto,
  UserMentionResponseDto,
  VideoResponseDto,
} from '.';
import { PageDto } from '../../../../../common/dto';
import { UserDataShareDto } from '../../../../../shared/user/dto';
import { UserMentionDto } from '../../../../mention/dto';
import { CommunityResponseDto } from '../../../../post/dto/responses';
import { ReactionResponseDto } from '../../../../reaction/dto/response';
import { AudienceResponseDto } from './audience.response.dto';
import { MediaResponseDto } from './media.response.dto';
import { PostSettingResponseDto } from './post-setting-response.dto';

export class PostResponseDto {
  @ApiProperty()
  @IsUUID()
  public id: string;

  @ApiProperty({
    type: String,
  })
  public content: string;

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
  public media: MediaResponseDto;

  @ApiProperty({
    type: PostSettingResponseDto,
  })
  @Transform(({ obj, value }) => {
    if (!value) {
      return {
        canReact: obj.canReact,
        canComment: obj.canComment,
        canShare: obj.canShare,
        isImportant: obj.isImportant,
        importantExpiredAt: obj.importantExpiredAt,
      };
    }
    return value;
  })
  public setting: PostSettingResponseDto;

  @ApiProperty()
  public isDraft: boolean;

  @ApiProperty()
  public isProcessing: boolean;

  @ApiProperty()
  public actor: UserDataShareDto;

  @ApiProperty({
    type: UserMentionDto,
    example: {
      dangdiep: {
        id: 1,
        username: 'dangdiep',
        avatar: 'https://google.com',
        fullname: 'Diep Dang',
      },
      tuine: {
        id: 2,
        username: 'tuine',
        avatar: 'https://google.com',
        fullname: 'Tui Day Ne',
      },
    },
  })
  @Transform(({ value }) => {
    if (Array.isArray(value) && value.length === 0) {
      return {};
    }
    return value;
  })
  public mentions: UserMentionResponseDto;

  @ApiProperty()
  public commentsCount: number;

  @ApiProperty()
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
  public reactionsCount: Record<string, Record<string, number>>;

  @ApiProperty()
  public markedReadPost: boolean;

  @ApiProperty()
  public isSaved: boolean;

  @ApiProperty()
  public createdAt: Date;

  @ApiProperty()
  public updatedAt: Date;

  @ApiProperty({
    type: AudienceResponseDto,
  })
  public audience: AudienceResponseDto;

  @ApiProperty()
  public type: string;

  @ApiProperty()
  public privacy: string;

  @ApiProperty()
  public isReported: boolean;

  @ApiProperty()
  public communities?: CommunityResponseDto[];

  @ApiProperty({
    type: [ReactionResponseDto],
    name: 'owner_reactions',
  })
  public ownerReactions?: ReactionResponseDto[] = [];

  @ApiProperty()
  public comments?: PageDto<CommentResponseDto>;

  public constructor(data: Partial<PostResponseDto>) {
    Object.assign(this, data);
  }
}
