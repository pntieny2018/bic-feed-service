import { IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AudienceRequestDto } from './audience.request.dto';
import { MediaDto } from './media.request.dto';

export class UpdateSeriesRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['user_ids']: [],
      ['group_ids']: [1],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto;

  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(64)
  @IsOptional()
  @Expose({
    name: 'title',
  })
  public title?: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(255)
  @IsOptional()
  @Expose({
    name: 'summary',
  })
  public summary?: string;

  @ApiProperty({
    type: MediaDto,
    example: {
      id: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
    },
  })
  @IsOptional()
  @Expose({
    name: 'cover_media',
  })
  public coverMedia?: MediaDto;
}
