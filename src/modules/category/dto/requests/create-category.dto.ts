import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, ValidateIf } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({
    type: String,
    example: '40dc4093-1bd0-4105-869f-8504e1986145',
    name: 'parent_id',
  })
  @IsNotEmpty()
  @IsUUID()
  @Expose({
    name: 'parent_id',
  })
  public parentId: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  public name: string;
}
