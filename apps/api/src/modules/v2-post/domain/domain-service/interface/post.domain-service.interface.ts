import { PostEntity } from '../../model/content';
import { GroupDto } from '../../../../v2-group/application';
import { UserDto } from '../../../../v2-user/application';
import { PublishPostCommandPayload } from '../../../application/command/publish-post/publish-post.command';
import { ContentEntity } from '../../model/content/content.entity';

export type PostCreateProps = {
  groups: GroupDto[];
  userId: string;
};
export type PostPublishProps = {
  postEntity: PostEntity;
  newData: PublishPostCommandPayload & {
    groups?: GroupDto[];
    mentionUsers: UserDto[];
  };
};
export interface IPostDomainService {
  createDraftPost(input: PostCreateProps): Promise<PostEntity>;
  publishPost(input: PostPublishProps): Promise<void>;
  autoSavePost(input: PostPublishProps): Promise<void>;
  markSeen(contentEntity: ContentEntity, userId: string): Promise<void>;
  markReadImportant(contentEntity: ContentEntity, userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
