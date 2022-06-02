import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PageOptionsDto } from '../../../../common/dto';

export class GetListArticlesDto extends PageOptionsDto {
  @ApiProperty({
    type: [String],
  })
  @IsNotEmpty()
  public categories: string[] = [];

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  public series?: string[] = [];

  @ApiProperty({
    type: [String],
  })
  @IsOptional()
  public hashtags?: string[] = [];

  @ApiProperty({ name: 'group_id', example: 9 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Expose({
    name: 'group_id',
  })
  public groupId: number;
}
