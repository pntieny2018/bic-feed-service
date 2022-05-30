import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { UpdatePostDto } from '../../../post/dto/requests';

export class UpdateArticleDto extends UpdatePostDto {
  @ApiProperty({
    type: [String],
  })
  @IsNotEmpty()
  public categories: string[];

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  public series?: string[];

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  public hashtags?: string[];
}
