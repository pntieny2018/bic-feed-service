import { ApiProperty } from '@nestjs/swagger';
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
import { UserMentionDto } from '../../../../mention/dto';
import { PostSettingDto } from '../../../../post/dto/common/post-setting.dto';
import { MediaDto } from '../../../application/dto';

import { AudienceRequestDto } from './audience.request.dto';

export class UpdatePostRequestDto {
  @ApiProperty({ description: 'Content of post', type: String })
  @IsOptional()
  @Type(() => String)
  public content?: string;

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  public series?: string[];

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  public tags?: string[];

  @ApiProperty({ description: 'Audience', type: AudienceRequestDto, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto;

  @ApiProperty({
    description: 'Post data, includes content, images, files, videos',
    type: MediaDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  public media?: MediaDto;

  @ApiProperty({ type: UserMentionDto })
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

  @ApiProperty({ type: LinkPreviewDto })
  @IsOptional()
  @Type(() => LinkPreviewDto)
  @Expose({ name: 'link_preview' })
  public linkPreview?: LinkPreviewDto;

  public constructor(data: UpdatePostRequestDto) {
    Object.assign(this, data);
  }
}

export class AutoSavePostRequestDto extends UpdatePostRequestDto {
  @ApiProperty({ description: 'Setting post', type: PostSettingDto, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostSettingDto)
  public setting?: PostSettingDto;
}

export class PublishPostRequestDto extends UpdatePostRequestDto {}

export class SchedulePostRequestDto extends PublishPostRequestDto {
  @ApiProperty({ required: true, type: Date })
  @Expose({ name: 'scheduled_at' })
  @IsNotEmpty()
  @IsDateString()
  public scheduledAt: Date;

  public constructor(data: SchedulePostRequestDto) {
    super(data);
    Object.assign(this, data);
  }
}

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
  @Expose({ name: 'can_react' })
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
  @Expose({ name: 'can_comment' })
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
  @Expose({ name: 'is_important' })
  public isImportant: boolean;

  @ApiProperty({
    required: false,
    type: Date,
    description: 'Set important expire time',
    default: null,
    name: 'important_expired_at',
  })
  @ValidateIf((i) => i.isImportant === true)
  @IsOptional()
  @IsDateString()
  @Expose({ name: 'important_expired_at' })
  public importantExpiredAt?: Date;
}

export class CreateDraftPostRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
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
