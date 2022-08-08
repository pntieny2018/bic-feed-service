import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';

export class GetNewsFeedDto extends PageOptionsDto {
  @ApiProperty({ name: 'is_important', example: true })
  @IsOptional()
  @Expose({
    name: 'is_important',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  public isImportant?: boolean;
}
