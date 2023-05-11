import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { AudienceRequestDto } from './audience.request.dto';

export class CreateDraftPostRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['group_ids']: ['02032703-6db0-437a-a900-d93e742c3cb9'],
    },
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto = {
    groupIds: [],
  };
}
