import { MediaDto } from '../../../media/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { UserMentionDto } from '../../../mention/dto';
import { PostSettingDto } from '../common/post-setting.dto';
import { AudienceRequestDto } from './audience.request.dto';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { ValidateMedia } from '../../../media/validators/media.validator';
import { ValidateMention } from '../../../mention/validators/validate-mention.validator';
import { LinkPreviewDto } from '../../../link-preview/dto/link-preview.dto';

export class CreatePostDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['user_ids']: [],
      ['group_ids']: [1],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto = {
    groupIds: [],
  };

  @ApiProperty({
    description: 'Content of post',
    type: String,
    example: 'Bla bla bla...',
  })
  @IsOptional()
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
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  public media: MediaDto = { files: [], images: [], videos: [] };

  @ApiProperty({
    type: UserMentionDto,
    example: {
      dangdiep: {
        id: '7251dac7-5088-4a33-b900-d1b058edaf98',
        username: 'dangdiep',
        avatar: 'https://google.com',
        fullname: 'Diep Dang',
      },
      tuine: {
        id: '7251dac7-5088-4a33-b900-d1b058edaf99',
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
  @ValidateMention()
  public mentions?: string[] = [];

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
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  public tags?: string[] = [];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  // @CanUseSeries()
  public series?: string[] = [];
}