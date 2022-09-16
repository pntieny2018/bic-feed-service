import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';

export class GetRelatedArticlesDto extends PageOptionsDto {
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  public id: string;
}
