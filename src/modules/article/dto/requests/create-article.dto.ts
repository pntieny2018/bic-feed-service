import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreatePostDto } from '../../../post/dto/requests';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  public categories: string[] = [];

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  public series?: string[] = [];

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  public hashtags?: string[] = [];
}
