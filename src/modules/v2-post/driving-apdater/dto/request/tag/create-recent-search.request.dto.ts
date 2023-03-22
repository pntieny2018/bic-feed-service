import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PostType } from '../../../../data-type';

export class CreateRecentSearchRequestDto {
  @ApiProperty({
    description: 'The keyword input when user search',
    example: 'Hi !',
  })
  @IsString()
  @IsNotEmpty()
  @Transform((params) => (params.value ? params.value.trim() : ''))
  public keyword: string;

  @ApiProperty({
    description: 'Target entity. Support: [post,user,article]',
    required: false,
    default: PostType.POST,
    example: PostType.POST,
  })
  @IsEnum(PostType, {
    message: 'Target must be "post" | "article" | "artical" | "all"',
  })
  @Transform((params) => params.value ?? PostType.POST)
  public target: string = PostType.POST;
}
