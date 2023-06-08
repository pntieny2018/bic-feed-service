import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { AudienceRequestDto } from './audience.request.dto';

export class CreateDraftArticleRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['group_ids']: ['02032703-6db0-437a-a900-d93e742c3cb9'],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience: AudienceRequestDto = {
    groupIds: [],
  };
  public constructor(data: CreateDraftArticleRequestDto) {
    Object.assign(this, data);
  }
}
