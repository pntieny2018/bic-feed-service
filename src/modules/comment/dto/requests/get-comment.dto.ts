import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto/pagination';

export class GetCommentDto extends PageOptionsDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  public postId?: number = undefined;

  @ApiProperty({
    required: false,
    default: 10,
  })
  @IsOptional()
  public childLimit?: number = 10;
}
