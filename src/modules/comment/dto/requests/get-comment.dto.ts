import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';

export class GetCommentDto extends PageOptionsDto {
  @ApiProperty({
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  public parentId?: number = 0;

  @ApiProperty({
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  public postId?: number = 0;
}
