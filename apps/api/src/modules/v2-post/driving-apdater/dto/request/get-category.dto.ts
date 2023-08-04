import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../../../common/dto';

export class GetCategoryDto extends PageOptionsDto {
  @ApiProperty({ type: String, required: false })
  @Type(() => String)
  @IsOptional()
  public name?: string;

  @ApiProperty({ type: Number, required: false })
  @Type(() => Number)
  @IsOptional()
  public level?: number;

  @ApiProperty({
    name: 'is_created_by_me',
    type: Boolean,
    required: false,
  })
  @Type(() => Boolean)
  @IsOptional()
  public isCreatedByMe?: boolean;
}
