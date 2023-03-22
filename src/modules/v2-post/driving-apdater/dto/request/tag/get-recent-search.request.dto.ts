import { PageOptionsDto } from '../../../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PostType } from '../../../../data-type';

export class GetRecentSearchRequestDto extends PageOptionsDto {
  @ApiProperty({
    description: 'Target entity. Support[all,post,article,user]',
    default: PostType.POST,
    required: false,
    enum: PostType,
  })
  @IsOptional()
  @Transform((params) => {
    return params.value ?? PostType.POST;
  })
  public target?: PostType = PostType.ALL;
}
