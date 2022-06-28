import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
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
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  public categories: string[] = [];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
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
