import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { PostSettingDto } from '../common/post-setting.dto';

export class PostSettingResponseDto extends PostSettingDto {
  @ApiProperty({
    type: Boolean,
    default: true,
    required: false,
    description: 'Allow to react',
    name: 'can_react',
  })
  @IsOptional()
  @IsBoolean()
  public canReact?: boolean = true;

  @ApiProperty({
    type: Boolean,
    default: true,
    required: false,
    description: 'Allow to share post',
    name: 'can_share',
  })
  @IsOptional()
  @IsBoolean()
  public canShare?: boolean = true;

  @ApiProperty({
    type: Boolean,
    default: true,
    required: false,
    description: 'Allow to comment',
    name: 'can_comment',
  })
  @IsOptional()
  @IsBoolean()
  public canComment?: boolean = true;

  @ApiProperty({
    type: Boolean,
    example: true,
    default: false,
    required: false,
    description: 'Set important post',
    name: 'is_important',
  })
  @IsOptional()
  @IsBoolean()
  public isImportant?: boolean = false;

  @ApiProperty({
    required: false,
    example: '2021-11-03T16:59:00.000Z',
    type: Date,
    description: 'Set important expire time',
    default: null,
    name: 'important_expired_at',
  })
  @ValidateIf((i) => i.isImportant === true)
  @IsNotEmpty()
  @IsDateString()
  public importantExpiredAt?: Date = null;
}
