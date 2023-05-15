import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaDto } from '../shared/media/media.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { UserMentionDto } from '../shared/mention/user-mention.dto';
import { GiphyDto } from '../../../../v2-giphy/driving-adapter/dto/giphy.dto';

export class UpdateCommentRequestDto {
  @ApiPropertyOptional()
  @Type(() => String)
  @IsNotEmpty()
  @ValidateIf(
    (o) =>
      !(
        o.media?.images?.length > 0 ||
        o.media?.videos?.length > 0 ||
        o.media?.files?.length > 0 ||
        o.giphyId
      )
  )
  public content: string;

  @ApiPropertyOptional({
    description: 'Post data, includes content, images, files, videos',
    type: MediaDto,
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
  @IsNotEmpty()
  @ValidateIf((o) => o.content === null || o.content == undefined)
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  public media?: MediaDto = { files: [], images: [], videos: [] };

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

  @ApiPropertyOptional()
  @IsNotEmpty()
  @Type(() => GiphyDto)
  @Expose({
    name: 'giphy',
  })
  @ValidateIf(
    (o) =>
      !(
        o.content ||
        o.media?.images?.length > 0 ||
        o.media?.videos?.length > 0 ||
        o.media?.files?.length > 0
      )
  )
  @Transform(({ value }) => {
    if (typeof value === 'object' && value?.type == 'gif') {
      if (value?.id) return value.id;
    }
    return '';
  })
  public giphyId?: string;
}
