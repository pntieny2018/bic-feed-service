import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { UpdatePostDto } from '../../../post/dto/requests';
import { Expose } from 'class-transformer';
import { CanUseCategory } from '../../validators/can-use-category.validator';
import { PostStatus } from '../../../../database/models/post.model';

export class CoverMediaDto {
  public id: string;
}
export class UpdateArticleDto extends UpdatePostDto {
  @ApiProperty({
    type: String,
  })
  @IsOptional()
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
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  @CanUseCategory()
  public categories?: string[];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  //@CanUseSeries()
  public series?: string[];

  @ApiProperty({
    type: [String],
    example: [10],
  })
  @IsOptional()
  @IsInt()
  @Expose({
    name: 'word_count',
  })
  public wordCount?: number;

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  public tags?: string[];

  @ApiProperty({
    type: [String],
    example: ['Beincomm', 'Seagame31'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  public hashtags?: string[];

  @ApiProperty({
    type: CoverMediaDto,
    example: {
      id: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
    },
  })
  @IsNotEmpty()
  @ValidateIf((i) => i.status === PostStatus.PUBLISHED)
  @Expose({
    name: 'cover_media',
  })
  public coverMedia: CoverMediaDto;
}
