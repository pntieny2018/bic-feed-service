import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class GetCategoryDto extends PageOptionsDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsOptional()
  public name?: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsOptional()
  public level?: number;

  @ApiProperty({
    name: 'is_created_by_me',
    type: Boolean,
  })
  @Type(() => Boolean)
  @IsOptional()
  public isCreatedByMe?: boolean;
}
