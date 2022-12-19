import { ApiProperty } from '@nestjs/swagger';
import { PostResponseDto } from '../../post/dto/responses';
import { CommentResponseDto } from '../../comment/dto/response';
import { ArticleResponseDto } from '../../article/dto/responses';

export class DetailContentReportResponseDto {
  @ApiProperty({
    type: PostResponseDto,
  })
  public post: PostResponseDto;

  @ApiProperty({
    type: CommentResponseDto,
  })
  public comment: CommentResponseDto;

  @ApiProperty({
    type: ArticleResponseDto,
  })
  public article: ArticleResponseDto;

  public setComment(comment: CommentResponseDto): void {
    this.comment = comment;
  }

  public setPost(post: PostResponseDto): void {
    this.post = post;
  }

  public setArticle(article: ArticleResponseDto): void {
    this.article = article;
  }
}
