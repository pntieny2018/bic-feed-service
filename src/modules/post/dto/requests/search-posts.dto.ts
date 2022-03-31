import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto/pagination/page-options.dto';
export class SearchPostsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    type: 'string',
    items: { type: 'integer' },
    description: 'List of user id',
    default: null,
    example: '1,2,3',
  })
  @IsOptional()
  @Transform(({ value }) => value.split(','))
  @Transform(({ value }) => value.map((i) => Number(i)))
  @IsInt({
    message: JSON.stringify({
      title: 'actors',
      message: "Property 'actors' must be an array integer",
    }),
    each: true,
  })
  public actors?: number[];

  @ApiProperty({ description: 'filter content', required: false })
  @IsOptional()
  @IsString()
  public content?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Important',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value == 'true')
  @IsBoolean()
  public important?: boolean;

  @ApiProperty({
    description: 'filter posts created_time > start_time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  public startTime?: string;

  @ApiProperty({
    description: 'filter posts created_time < end_time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  public endTime?: string;
}
