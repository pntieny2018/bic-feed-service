import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { GiphyDto } from '../../../../v2-giphy/driving-adapter/dto/giphy.dto';
import { MediaRequestDto } from './media.request.dto';
import { UserMentionDto } from '../../../application/dto/user-mention.dto';

export class UpdateCommentRequestDto {
  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  public content: string;

  @ApiPropertyOptional({
    description: 'Post data, includes content, images, files, videos',
    type: MediaRequestDto,
    required: false,
    example: {
      images: [
        {
          id: 1,
          url: 'https://www.beincom.io/file',
          name: 'File name 1',
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
      beincom: {
        id: '26799d29-189b-435d-b618-30fb70e9b09e',
        username: 'beincom',
        fullname: 'Beincom EVOL',
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
  public mentions?: string[];

  @ApiPropertyOptional({
    type: GiphyDto,
    name: 'giphy',
    example: {
      id: '3pZipqyo1sqHDfJGtz',
      type: 'gif',
      url: 'https://i.giphy.com/3pZipqyo1sqHDfJGtz',
    },
  })
  @IsOptional()
  @Type(() => GiphyDto)
  @Expose({
    name: 'giphy',
  })
  @Transform(({ value }) => {
    if (typeof value === 'object') {
      if (value?.id) return value.id;
    }
    return '';
  })
  public giphyId?: string;
}
