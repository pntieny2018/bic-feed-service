import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { SearchPostsDto } from '../../../post/dto/requests';

export class SearchArticlesDto extends SearchPostsDto {
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
}
