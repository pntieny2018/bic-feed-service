import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../../common/dto/pagination';

export class GetCommentDto extends PageOptionsDto {
  @ApiProperty({
    required: true,
  })
  public postId: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  public parentId?: number = undefined;

  @ApiProperty({
    required: false,
    default: 10,
  })
  @IsOptional()
  public childLimit?: number = 10;
}
