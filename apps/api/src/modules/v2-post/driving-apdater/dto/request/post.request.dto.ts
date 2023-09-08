import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { LinkPreviewDto } from '../../../../link-preview/dto/link-preview.dto';
import { MediaDto } from '../../../../media/dto';
import { UserMentionDto } from '../../../../mention/dto';
import { PostSettingDto } from '../../../../post/dto/common/post-setting.dto';

import { AudienceRequestDto } from './audience.request.dto';
import { MediaRequestDto } from './media.request.dto';

export class AutoSavePostRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    required: false,
    example: {
      ['user_ids']: [],
      ['group_ids']: ['26799d29-189b-435d-b618-30fb70e9b09e'],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto;

  @ApiProperty({
    description: 'Content of post',
    type: String,
    example: 'Bla bla bla...',
  })
  @IsOptional()
  @Type(() => String)
  public content: string;

  @ApiProperty({
    description: 'Post data, includes content, images, files, videos',
    type: MediaDto,
    required: false,
    example: {
      images: [
        {
          id: '26799d29-189b-435d-b618-30fb70e9b09e',
          url: 'https://google.com',
          name: 'FIle name 1',
        },
      ],
      videos: [],
      files: [],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  public media?: MediaDto;

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingDto,
    required: false,
    example: {
      canReact: true,
      canComment: true,
      isImportant: false,
      importantExpiredAt: null,
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostSettingDto)
  public setting?: PostSettingDto;

  @ApiProperty({
    type: UserMentionDto,
    example: {
      dangdiep: {
        id: '26799d29-189b-435d-b618-30fb70e9b09e',
        username: 'dangdiep',
        avatar: 'https://google.com',
        fullname: 'Diep Dang',
      },
      tuine: {
        id: '26799d29-189b-435d-b618-30fb70e9b09f',
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
        if (value[property]?.id) {
          mentionUserIds.push(value[property].id);
        }
      }
      return mentionUserIds;
    }
    return value;
  })
  public mentions?: string[];

  @ApiProperty({
    type: LinkPreviewDto,
    example: {
      url: 'https://beincomm.com',
      domain: 'beincomm.com',
      image: 'https://www.beincomm.com/images/bic_welcomeAd_banner.webp',
      title: 'This is title',
      description: 'This is description',
    },
  })
  @IsOptional()
  @Type(() => LinkPreviewDto)
  @Expose({
    name: 'link_preview',
  })
  public linkPreview?: LinkPreviewDto;

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public tags?: string[];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public series?: string[];
}

export class PublishPostRequestDto {
  @ApiPropertyOptional({
    description: 'Audience',
    type: AudienceRequestDto,
    required: true,
    example: {
      ['user_ids']: [],
      ['group_ids']: ['26799d29-189b-435d-b618-30fb70e9b09e'],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto;

  @ApiPropertyOptional({
    description: 'Content of post',
    type: String,
    example: 'Bla bla bla...',
  })
  @IsOptional()
  @Type(() => String)
  public content?: string;

  @ApiPropertyOptional({
    description: 'Post data, includes content, images, files, videos',
    type: MediaDto,
    required: false,
    example: {
      images: [
        {
          id: '26799d29-189b-435d-b618-30fb70e9b09e',
        },
      ],
      videos: [],
      files: [],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaRequestDto)
  public media?: MediaRequestDto;

  @ApiPropertyOptional({
    type: UserMentionDto,
    example: {
      dangdiep: {
        id: '26799d29-189b-435d-b618-30fb70e9b09e',
        username: 'dangdiep',
        avatar: 'https://google.com',
        fullname: 'Diep Dang',
      },
      tuine: {
        id: '26799d29-189b-435d-b618-30fb70e9b09f',
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
        if (value[property]?.id) {
          mentionUserIds.push(value[property].id);
        }
      }
      return mentionUserIds;
    }
    return value;
  })
  public mentions?: string[];

  @ApiPropertyOptional({
    type: LinkPreviewDto,
    example: {
      url: 'https://beincomm.com',
      domain: 'beincomm.com',
      image: 'https://www.beincomm.com/images/bic_welcomeAd_banner.webp',
      title: 'This is title',
      description: 'This is description',
    },
  })
  @IsOptional()
  @Type(() => LinkPreviewDto)
  @Expose({
    name: 'link_preview',
  })
  public linkPreview?: LinkPreviewDto;

  @ApiPropertyOptional({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public tags?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  public series?: string[];

  public constructor(data: PublishPostRequestDto) {
    Object.assign(this, data);
  }
}

export class UpdatePostRequestDto extends PublishPostRequestDto {}

export class PostSettingRequestDto {
  @ApiProperty({
    type: Boolean,
    default: true,
    required: false,
    description: 'Allow to react',
    name: 'can_react',
  })
  @IsNotEmpty()
  @IsBoolean()
  @Expose({
    name: 'can_react',
  })
  public canReact: boolean;

  @ApiProperty({
    type: Boolean,
    default: true,
    required: false,
    description: 'Allow to comment',
    name: 'can_comment',
  })
  @IsNotEmpty()
  @IsBoolean()
  @Expose({
    name: 'can_comment',
  })
  public canComment: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    default: false,
    required: false,
    description: 'Set important post',
    name: 'is_important',
  })
  @IsNotEmpty()
  @IsBoolean()
  @Expose({
    name: 'is_important',
  })
  public isImportant: boolean;

  @ApiProperty({
    required: false,
    example: '2021-11-03T16:59:00.000Z',
    type: Date,
    description: 'Set important expire time',
    default: null,
    name: 'important_expired_at',
  })
  @ValidateIf((i) => i.isImportant === true)
  @IsOptional()
  @IsDateString()
  @Expose({
    name: 'important_expired_at',
  })
  public importantExpiredAt?: Date;
}

export class CreateDraftPostRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['group_ids']: ['02032703-6db0-437a-a900-d93e742c3cb9'],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience: AudienceRequestDto = {
    groupIds: [],
  };
  public constructor(data: CreateDraftPostRequestDto) {
    Object.assign(this, data);
  }
}
