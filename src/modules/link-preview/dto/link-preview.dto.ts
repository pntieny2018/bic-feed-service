import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class LinkPreviewDto {
  @ApiProperty({
    description: 'Url of link preview',
    required: true,
    type: String,
    example: 'https://beincomm.com',
  })
  @IsNotEmpty()
  @Type(() => String)
  public url: string = null;

  @ApiProperty({
    description: 'Domain of link preview',
    type: String,
    example: 'beincomm.com',
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
  @IsOptional()
  @Type(() => String)
  public title: string = null;

  @ApiProperty({
    description: 'Description of link preview',
    type: String,
    example: 'This is description',
  })
  @IsOptional()
  @Type(() => String)
  public description: string = null;
}
