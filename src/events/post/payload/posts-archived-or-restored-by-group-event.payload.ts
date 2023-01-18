import { IPost } from '../../../database/models/post.model';

export class PostsArchivedOrRestoredByGroupEventPayload {
  public posts: IPost[];
  public mappingPostIdGroupIds: { [key: string]: string[] };
}
