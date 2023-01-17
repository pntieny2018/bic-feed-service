import { IPost } from '../../../database/models/post.model';

export class PostUpdateCacheGroupEventPayload {
  public posts: IPost[];
  public cacheIndex: { [key: string]: string[] };
}
