import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';
import { PostType } from '../../../../database/models/post.model';

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

  @ApiProperty({
    description: 'Type',
    required: false,
    default: '',
    enum: PostType,
  })
  @Expose()
  @IsOptional()
  public type?: PostType;
}
