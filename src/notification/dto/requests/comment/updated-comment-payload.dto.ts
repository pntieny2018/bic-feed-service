import { IPost } from '../../../../database/models/post.model';
import { CommentResponseDto } from '../../../../modules/comment/dto/response';
import { RelatedPartiesDto } from './related-parties.dto';

export class UpdatedCommentPayloadDto {
  public post: IPost;
  public comment: CommentResponseDto;
  public relatedParties: RelatedPartiesDto;
}
