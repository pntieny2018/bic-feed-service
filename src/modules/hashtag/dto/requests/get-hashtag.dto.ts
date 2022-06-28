import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class GetHashtagDto extends PageOptionsDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsOptional()
  public name?: string;
}
