import { ORDER } from '@beincom/constants';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export class GetPostDto {
  @ApiProperty({ enum: ORDER, default: ORDER.ASC, required: false, name: 'comment_order' })
  @IsEnum(ORDER)
  @IsOptional()
  @Expose({
    name: 'comment_order',
  })
  public commentOrder?: ORDER = ORDER.DESC;

  @ApiProperty({
    enum: ORDER,
    default: ORDER.ASC,
    required: false,
    name: 'child_comment_order',
  })
  @IsEnum(ORDER)
  @IsOptional()
  @Expose({
    name: 'child_comment_order',
  })
  public childCommentOrder?: ORDER = ORDER.DESC;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
    name: 'comment_limit',
  })
  @IsOptional()
  @Type(() => Number)
  @Expose({
    name: 'comment_limit',
  })
  public commentLimit?: number = 10;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
    name: 'child_comment_limit',
  })
  @IsOptional()
  @Type(() => Number)
  @Expose({
    name: 'child_comment_limit',
  })
  public childCommentLimit?: number;

  @ApiProperty({
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  public offset?: number = 0;

  @ApiProperty({
    required: false,
    type: Boolean,
    name: 'with_comment',
  })
  @IsOptional()
  @Transform(({ value }) => value == 'true')
  @Expose({
    name: 'with_comment',
  })
  public withComment?: boolean = false;

  public hideSecretAudienceCanNotAccess?: boolean = false;

  public constructor(data: Partial<GetPostDto> = {}) {
    Object.assign(this, data);
  }
}
