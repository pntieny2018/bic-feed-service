import { CommentDataDto } from '../common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { UserDataShareDto } from '../../../../shared/user/dto';

export class CreateCommentDto {
  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  public postId: number;

  @ApiProperty({ type: CommentDataDto })
  @ValidateNested()
  @Type(() => CommentDataDto)
  public data: CommentDataDto;

  @ApiProperty({ type: [UserDataShareDto] })
  @Type(() => UserDataShareDto)
  public mentions?: UserDataShareDto[];
}
