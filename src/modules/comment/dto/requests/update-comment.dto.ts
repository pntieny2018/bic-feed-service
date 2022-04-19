import { MediaDto } from '../../../media/dto/media.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidateIf, ValidateNested } from 'class-validator';
import { UserDataShareDto } from '../../../../shared/user/dto';

export class UpdateCommentDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @ValidateIf(
    (o) =>
      !(o.media?.images?.length > 0 || o.media?.videos?.length > 0 || o.media?.files?.length > 0)
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
  public media?: MediaDto = { files: [], images: [], videos: [] };

  @ApiProperty({ type: [UserDataShareDto] })
  public mentions?: UserDataShareDto[] = [];
}
