import { ApiProperty } from '@nestjs/swagger';
import { PostResponseDto } from '../../post/dto/responses';
import { CommentResponseDto } from '../../comment/dto/response';

export class DetailContentReportResponseDto {
  @ApiProperty({
    type: PostResponseDto,
  })
  public post: PostResponseDto;

  @ApiProperty({
    type: CommentResponseDto,
  })
  public comment: CommentResponseDto;

  public setComment(comment: CommentResponseDto): void {
    this.comment = comment;
  }

  public setPost(post: PostResponseDto): void {
    this.post = post;
  }
}
