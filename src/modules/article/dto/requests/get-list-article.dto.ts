import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { SearchPostsDto } from '../../../post/dto/requests';
import { Expose, Type } from 'class-transformer';

export class GetListArticlesDto extends SearchPostsDto {
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
