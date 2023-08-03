import { PostEntity } from '../../model/content';
import { GroupDto } from '../../../../v2-group/application';
import { UserDto } from '../../../../v2-user/application';
import { PublishPostDto } from '../../model/content/type/content.dto';
import { ContentEntity } from '../../model/content';
import { ArticleEntity } from '../../model/content';

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
  newData: PublishPostDto & {
    groups?: GroupDto[];
    mentionUsers: UserDto[];
  };
};
export interface IPostDomainService {
  createDraftPost(input: PostCreateProps): Promise<PostEntity>;
  createDraftArticle(input: ArticleCreateProps): Promise<ArticleEntity>;
  publishPost(input: PostPublishProps): Promise<void>;
  updatePost(input: PostPublishProps): Promise<void>;
  updateSetting(input: {
    entity: ContentEntity;
    authUser: UserDto;
    canComment: boolean;
    canReact: boolean;
    isImportant: boolean;
    importantExpiredAt: Date;
  }): Promise<void>;
  autoSavePost(input: PostPublishProps): Promise<void>;
  markSeen(contentEntity: ContentEntity, userId: string): Promise<void>;
  markReadImportant(contentEntity: ContentEntity, userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
