import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostType } from '../../../../data-type';

export class CleanRecentSearchRequestDto {
  @ApiProperty({
    description: 'Target entity. Support [all,post,article,user]',
    default: PostType.POST,
    enum: PostType,
  })
  @IsEnum(PostType, {
    message: 'Target must be "post" | "article"  | "all"',
  })
  @IsNotEmpty()
  public target: PostType;
}
