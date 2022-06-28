import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { GetPostDto } from '../../../post/dto/requests';

export class GetArticleDto extends GetPostDto {
  @ApiProperty({
    type: [String],
  })
  @IsNotEmpty()
  public categories: string[] = [];
}
