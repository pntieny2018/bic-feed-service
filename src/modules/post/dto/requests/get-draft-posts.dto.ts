import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { PostType } from '../../../../database/models/post.model';

export class GetDraftPostDto extends PageOptionsDto {
  @ApiProperty({
    name: 'is_failed',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_failed' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  public isFailed?: boolean;

  @ApiProperty({
    name: 'is_processing',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_processing' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  public isProcessing?: boolean;

  @ApiProperty({
    description: 'Type',
    required: false,
    default: '',
    enum: PostType,
  })
  @Expose()
  @IsOptional()
  @IsEnum(PostType)
  @ValidateIf((i) => i.type !== '')
  public type?: PostType;
}
