import { PostModel, PostStatus } from '../../database/models/post.model';

export class PostHelper {
  public static isArchived(post: PostModel): boolean {
    if (!post) return false;
    return (
      post.status !== PostStatus.DRAFT &&
      post.groups &&
      (!post.groups.length || post.groups.filter((e) => e.isArchived).length === post.groups.length)
    );
  }

  public static filterArchivedPost(post: PostModel): PostModel {
    if (this.isArchived(post)) {
      return null;
    }
    return post;
  }
  public static filterArchivedPosts(posts: PostModel[]): PostModel[] {
    return posts.filter((post) => {
      return !this.isArchived(post);
    });
  }
}
