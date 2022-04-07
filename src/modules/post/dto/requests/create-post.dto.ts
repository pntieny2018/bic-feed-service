import { UserSharedDto } from './../../../../shared/user/dto/user-shared.dto';
import { AudienceDto } from './../common/audience.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  isArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { PostSettingDto } from '../common/post-setting.dto';
import { MediaDto } from '../../../media/dto';

export class CreatePostDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceDto,
    example: {
      users: [],
      groups: [
        {
          id: 1,
        },
      ],
    },
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AudienceDto)
  public audience: AudienceDto;

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
    description: 'Mention',
    type: UserSharedDto,
    isArray: true,
    required: false,
    example: [
      {
        id: 1,
        username: 'username1',
      },
      {
        id: 2,
        username: 'username1',
      },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserSharedDto)
  @IsArray()
  public mentions?: UserSharedDto[] = [];

  @ApiProperty({
    description: 'To know draft post or not',
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  public isDraft = true;
}
