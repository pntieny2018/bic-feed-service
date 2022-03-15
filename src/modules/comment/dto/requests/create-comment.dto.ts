import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreateMentionDto } from '../../../mention/dto';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Id of post',
    type: Number,
  })
  public postId: number;

  @ApiProperty({
    required: false,
    description: 'ID of comment is replied',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? null : value))
  public parentId?: number = null;

  @ApiProperty({
    required: false,
    description: 'content of comment',
  })
  @Transform(({ value }) => (value === null ? undefined : value))
  public content?: string = undefined;

  @ApiProperty({
    required: false,
    description: 'IDs of media',
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? [] : value))
  public mediaIds?: number[] = [];

  @ApiProperty({
    required: false,
    description: 'mentions in comment',
    type: CreateMentionDto,
  })
  @IsOptional()
  @ValidateNested()
  public mentions?: CreateMentionDto;
}
