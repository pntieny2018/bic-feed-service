import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreatePostDto } from '.';

export class CreateArticleDto extends CreatePostDto {
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  public title: string;

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  public summary?: string = null;

  @ApiProperty({
    type: [String],
  })
  @IsNotEmpty()
  public categories: string[] = [];

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  public series?: string[] = [];

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  public hashtags?: string[] = [];
}
