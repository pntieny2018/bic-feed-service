import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { POST_TYPE } from '../../../../data-type';

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
    default: POST_TYPE.POST,
    example: POST_TYPE.POST,
  })
  @IsEnum(POST_TYPE, {
    message: 'Target must be "post" | "article" | "artical" | "all"',
  })
  @Transform((params) => params.value ?? POST_TYPE.POST)
  public target: string = POST_TYPE.POST;
}
