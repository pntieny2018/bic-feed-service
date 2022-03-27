import { IPost } from '../../../database/models/post.model';
import { IComment } from '../../../database/models/comment.model';

export class CommentHasBeenUpdatedEventPayload {
  public oldPost?: IPost;
  public post: IPost;
  public comment: IComment;
}
