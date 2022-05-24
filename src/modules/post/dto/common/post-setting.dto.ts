import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsDateString, ValidateIf, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class PostSettingDto {
  @ApiProperty({
    type: Boolean,
    default: true,
    required: false,
    description: 'Allow to react',
    name: 'can_react',
  })
  @IsOptional()
  @IsBoolean()
  @Expose({
    name: 'can_react',
  })
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
  @Expose({
    name: 'can_share',
  })
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
  @Expose({
    name: 'can_comment',
  })
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
  @Expose({
    name: 'is_important',
  })
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
  @Expose({
    name: 'important_expired_at',
  })
  public importantExpiredAt?: Date = null;
}
