import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../common/dto';

export class GetBlockedContentOfMeDto extends PageOptionsDto {
  @ApiProperty({
    name: 'target_ids',
    required: false,
  })
  @Expose({
    name: 'target_ids',
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  public specTargetIds?: string[];
}
