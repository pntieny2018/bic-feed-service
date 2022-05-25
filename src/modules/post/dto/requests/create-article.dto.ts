import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { CreatePostDto } from '.';

export class CreateArticleDto extends CreatePostDto {
  @ApiProperty({
    type: [String],
  })
  @IsNotEmpty()
  public categories: string[] = [];
}
