import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { UpdatePostDto } from '../../../post/dto/requests';
import { Expose, Transform } from 'class-transformer';
import { CanUseSeries } from '../../validators/can-use-series.validator';
import { CanUseCategory } from '../../validators/can-use-category.validator';

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
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  @CanUseCategory()
  public categories?: string[];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @CanUseSeries()
  public series?: string[];

  @ApiProperty({
    type: [String],
    example: ['Beincomm', 'Seagame31'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  public hashtags?: string[];

  @ApiProperty({
    type: CoverMediaDto,
    example: {
      id: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
    },
  })
  @IsOptional()
  @Expose({
    name: 'cover_media',
  })
  public coverMedia?: CoverMediaDto;
}
