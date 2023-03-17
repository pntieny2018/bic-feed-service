import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { POST_TYPE } from '../../../../data-type';

export class CleanRecentSearchRequestDto {
  @ApiProperty({
    description: 'Target entity. Support [all,post,article,user]',
    default: POST_TYPE.POST,
    enum: POST_TYPE,
  })
  @IsEnum(POST_TYPE, {
    message: 'Target must be "post" | "article"  | "all"',
  })
  @IsNotEmpty()
  public target: POST_TYPE;
}
