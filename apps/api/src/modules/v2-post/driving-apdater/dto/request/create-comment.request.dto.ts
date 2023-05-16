import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID, ValidateIf, ValidateNested } from 'class-validator';
import { GiphyDto } from '../../../../v2-giphy/driving-adapter/dto/giphy.dto';
import { MediaRequestDto } from './media.request.dto';
import { UserMentionDto } from '../../../application/dto/user-mention.dto';

export class CreateCommentRequestDto {
  @ApiProperty({
    type: String,
    example: '40dc4093-1bd0-4105-869f-8504e1986145',
    name: 'post_id',
  })
  @IsNotEmpty()
  @IsUUID()
  @Expose({
    name: 'post_id',
  })
  public postId: string;

  @ApiProperty({ type: String })
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

  @ApiProperty({
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
  @IsNotEmpty()
  @ValidateIf((o) => o.content === null || o.content == undefined)
  @ValidateNested({ each: true })
  @Type(() => MediaRequestDto)
  public media?: MediaRequestDto = { files: [], images: [], videos: [] };

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

  @ApiProperty()
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
    return value;
  })
  public giphyId?: string;
}
