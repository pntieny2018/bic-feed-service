import { MediaDto } from '../../../media/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID, ValidateIf, ValidateNested } from 'class-validator';
import { UserMentionDto } from '../../../mention/dto';
import { GiphyDto } from '../../../giphy/dto/requests';
import { ValidateMedia } from '../../../media/validators/media.validator';

export class CreateCommentDto {
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
        o.giphy?.id
      )
  )
  public content: string;

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
  @ValidateMedia()
  public media?: MediaDto = { files: [], images: [], videos: [] };

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
        if (value[property]?.id) mentionUserIds.push(value[property].id);
      }
      return mentionUserIds;
    }
    return value;
  })
  public mentions?: string[] = [];

  @ApiProperty({
    type: GiphyDto,
    example: {
      id: '3pZipqyo1sqHDfJGtz',
      type: 'gif',
    },
  })
  @IsNotEmpty()
  @ValidateIf(
    (o) =>
      !(
        o.content ||
        o.media?.images?.length > 0 ||
        o.media?.videos?.length > 0 ||
        o.media?.files?.length > 0
      )
  )
  @Type(() => GiphyDto)
  public giphy?: GiphyDto = null;
}
