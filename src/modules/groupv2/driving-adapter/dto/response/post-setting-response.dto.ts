import { ApiProperty } from '@nestjs/swagger';

export class PostSettingResponseDto {
  @ApiProperty({
    type: Boolean,
    name: 'can_react',
  })
  public canReact?: boolean = true;

  @ApiProperty({
    type: Boolean,
    name: 'can_share',
  })
  public canShare?: boolean = true;

  @ApiProperty({
    type: Boolean,
    name: 'can_comment',
  })
  public canComment?: boolean = true;

  @ApiProperty({
    type: Boolean,
    name: 'is_important',
  })
  public isImportant?: boolean = false;

  @ApiProperty({
    type: Date,
    name: 'important_expired_at',
  })
  public importantExpiredAt?: Date = null;
}
