import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { OrderEnum, PageOptionsDto } from '../../../../common/dto';

export class GetCommentDto extends PageOptionsDto {
  @ApiProperty({
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  public parentId?: number = 0;
}
