import { RelatedPartiesDto } from './related-parties.dto';
import { IPost } from '../../../../database/models/post.model';
import { CommentResponseDto } from '../../../../modules/comment/dto/response';

export class CreatedCommentPayloadDto {
  public isReply: boolean;
  public post: IPost;
  public comment: CommentResponseDto;
  public relatedParties: RelatedPartiesDto;
}
