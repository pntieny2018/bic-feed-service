import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, ValidateNested, ValidateIf } from 'class-validator';
import { PostSettingDto } from '../common/post-setting.dto';
import { MediaDto } from '../../../media/dto';
import { AudienceRequestDto } from './audience.request.dto';
import { UserMentionDto } from '../../../mention/dto';

export class UpdatePostDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['user_ids']: [],
      ['group_ids']: [1],
    },
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience: AudienceRequestDto;

  @ApiProperty({
    description: 'Content of post',
    type: String,
    example: 'Bla bla bla...',
  })
  @IsNotEmpty()
  @ValidateIf(
    (o) =>
      o.media?.images.length === 0 && o.media?.videos.length === 0 && o.media?.files.length === 0
  )
  @Type(() => String)
  public content: string = null;

  @ApiProperty({
    description: 'Post data, includes content, images, files, videos',
    type: MediaDto,
    required: false,
    example: {
      images: [
        {
          id: 1,
          url: 'https://google.com',
          name: 'FIle name 1',
        },
      ],
      videos: [],
      files: [],
    },
  })
  @IsNotEmpty()
  @ValidateIf((o) => o.content === null || o.content == undefined)
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  public media: MediaDto = { files: [], images: [], videos: [] };

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingDto,
    required: false,
    example: {
      canShare: true,
      canReact: true,
      canComment: true,
      isImportant: false,
      importantExpiredAt: null,
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostSettingDto)
  public setting?: PostSettingDto = {
    canShare: true,
    canReact: true,
    canComment: true,
    isImportant: false,
    importantExpiredAt: null,
  };

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
  @IsOptional()
  @Type(() => UserMentionDto)
  @Transform(({ value }) => {
    if (typeof value === 'object') {
      const mentionUserIds = [];
      for (const property in value) {
        if (value[property]?.id) mentionUserIds.push(value[property].id);
      }
      return mentionUserIds;
    }
    return value;
  })
  public mentions?: number[] = [];

  public isDraft?: boolean;
}
