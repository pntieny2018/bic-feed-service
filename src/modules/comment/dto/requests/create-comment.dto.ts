import { MediaDto } from '../../../media/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { UserDataShareDto } from '../../../../shared/user/dto';

export class CreateCommentDto {
  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  public postId: number;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
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
  @IsOptional()
  @ValidateNested({ each: true })
  public media?: MediaDto = { files: [], images: [], videos: [] };

  @ApiProperty({ type: [UserDataShareDto], required: false })
  @Type(() => UserDataShareDto)
  public mentions?: UserDataShareDto[] = [];
}
