import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class LinkPreviewDto {
  @ApiProperty({
    description: 'Url of link preview',
    required: true,
    type: String,
    example: 'https://beincomm.com',
    maxLength: 2048,
  })
  @IsNotEmpty()
  @Type(() => String)
  public url: string;

  @ApiProperty({
    description: 'Domain of link preview',
    type: String,
    example: 'beincomm.com',
  })
  @Transform((e) => {
    if (e.value && e.value.length > 160) {
      return e.value.substring(0, 160) + '...';
    }
    return e.value;
  })
  @IsOptional()
  @Type(() => String)
  public domain: string = null;

  @ApiProperty({
    description: 'Image of link preview',
    type: String,
    example: 'https://www.beincomm.com/images/bic_welcomeAd_banner.webp',
  })
  @IsOptional()
  @Type(() => String)
  public image: string = null;

  @ApiProperty({
    description: 'Title of link preview',
    type: String,
    example: 'This is title',
  })
  @Transform((e) => {
    if (e.value && e.value.length > 250) {
      return e.value.substring(0, 250) + '...';
    }
    return e.value;
  })
  @IsOptional()
  @Type(() => String)
  public title: string = null;

  @ApiProperty({
    description: 'Description of link preview',
    type: String,
    example: 'This is description',
  })
  @Transform((e) => {
    if (e.value && e.value.length > 250) {
      return e.value.substring(0, 250) + '...';
    }
    return e.value;
  })
  @IsOptional()
  @Type(() => String)
  public description: string = null;
}
