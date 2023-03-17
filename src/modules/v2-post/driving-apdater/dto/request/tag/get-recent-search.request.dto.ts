import { PageOptionsDto } from '../../../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { POST_TYPE } from '../../../../data-type';

export class GetRecentSearchRequestDto extends PageOptionsDto {
  @ApiProperty({
    description: 'Target entity. Support[all,post,article,user]',
    default: POST_TYPE.POST,
    required: false,
    enum: POST_TYPE,
  })
  @IsOptional()
  @Transform((params) => {
    return params.value ?? POST_TYPE.POST;
  })
  public target?: POST_TYPE = POST_TYPE.ALL;
}
