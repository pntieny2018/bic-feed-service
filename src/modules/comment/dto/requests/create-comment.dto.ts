import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreateMentionDto } from '../../../mention/dto';

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
  public parentId?: number = null;

  @ApiProperty({
    required: false,
    description: 'content of comment',
  })
  public content?: string = null;

  @ApiProperty({
    required: false,
    description: 'IDs of media',
    type: Number,
  })
  @IsOptional()
  public mediaIds?: number[] = [];

  @ApiProperty({
    required: false,
    description: 'mentions in comment',
    type: CreateMentionDto,
  })
  @IsOptional()
  @ValidateNested()
  public mentions: CreateMentionDto;
}
