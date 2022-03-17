import { Type } from 'class-transformer';
import { CommentDataDto } from '../common';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { UserDataShareDto } from '../../../../shared/user/dto';

export class UpdateCommentDto {
  @ApiProperty({ type: CommentDataDto })
  @ValidateNested()
  @Type(() => CommentDataDto)
  public data: CommentDataDto;

  @ApiProperty({ type: [CommentDataDto] })
  public mentions?: UserDataShareDto[];
}
