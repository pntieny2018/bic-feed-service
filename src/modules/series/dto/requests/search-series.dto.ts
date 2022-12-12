import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto/pagination/page-options.dto';
export class SearchSeriesDto extends PageOptionsDto {
  @ApiProperty({ description: 'filter content', required: false, name: 'content_search' })
  @IsOptional()
  @IsString()
  @Expose({
    name: 'content_search',
  })
  public contentSearch?: string;

  @ApiProperty({
    description: 'Group IDs',
    required: false,
    name: 'group_ids',
  })
  @Expose({
    name: 'group_ids',
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  public groupIds?: string[];
}
