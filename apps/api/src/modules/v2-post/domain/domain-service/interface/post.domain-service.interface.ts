import { GroupDto } from '../../../../v2-group/application';
import { UserDto } from '../../../../v2-user/application';
import { UpdatePostCommandPayload } from '../../../application/command/update-post/update-post.command';
import { PostEntity, ArticleEntity } from '../../model/content';

export type PublishPostPayload = {
  id: string;
  groupIds: string[];
  authUser: UserDto;
  content?: string;
  tagIds?: string[];
  seriesIds?: string[];
  mentionUserIds?: string[];
  linkPreview?: {
    url: string;
    domain: string;
    image: string;
    title: string;
    description: string;
  };
  media?: {
    filesIds: string[];
    imagesIds: string[];
    videosIds: string[];
  };
};

export type PostCreateProps = {
  groups: GroupDto[];
  userId: string;
};

export type ArticleCreateProps = {
  groups?: GroupDto[];
  userId: string;
};

export type PostPublishProps = {
  postEntity: PostEntity;
  newData: PublishPostPayload & {
    groups?: GroupDto[];
    mentionUsers: UserDto[];
  };
};

export type UpdatePostProps = UpdatePostCommandPayload;

export type UpdatePostResult = {
  postEntity: PostEntity;
  groups?: GroupDto[];
  mentionUsers?: UserDto[];
};

export interface IPostDomainService {
  getPostById(postId: string, authUserId: string): Promise<PostEntity>;
  createDraftPost(input: PostCreateProps): Promise<PostEntity>;
  createDraftArticle(input: ArticleCreateProps): Promise<ArticleEntity>;
  publishPost(input: UpdatePostProps): Promise<PostEntity>;
  updatePost(props: UpdatePostProps): Promise<PostEntity>;
  updateSetting(input: {
    contentId: string;
    authUser: UserDto;
    canComment: boolean;
    canReact: boolean;
    isImportant: boolean;
    importantExpiredAt: Date;
  }): Promise<void>;
  autoSavePost(input: UpdatePostProps): Promise<void>;
  markSeen(contentId: string, userId: string): Promise<void>;
  markReadImportant(contentId: string, userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
