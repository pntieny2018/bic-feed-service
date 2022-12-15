import { IsArray, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../common/dto';

export class GetBlockedContentOfMeDto extends PageOptionsDto {
  @ApiProperty({
    name: 'target_ids',
  })
  @Expose({
    name: 'target_ids',
  })
  @IsArray()
  @IsOptional()
  public specTargetIds?: string[];
}
