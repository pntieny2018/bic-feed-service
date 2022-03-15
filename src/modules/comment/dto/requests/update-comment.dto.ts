import { ApiProperty } from '@nestjs/swagger';
import { CreateMentionDto } from '../../../mention/dto';
import { IsOptional, ValidateNested } from 'class-validator';

export class UpdateCommentDto {
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
