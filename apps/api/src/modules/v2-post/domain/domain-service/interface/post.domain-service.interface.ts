import { PostEntity } from '../../model/post';
import { GroupDto } from '../../../../v2-group/application';

export type PostCreateProps = {
  groups: GroupDto[];
  userId: string;
};

export interface IPostDomainService {
  createDraftPost(data: PostCreateProps): Promise<PostEntity>;
  publishPost(postEntity: PostEntity, newData: any, groups: GroupDto[]): Promise<PostEntity>;
  delete(id: string): Promise<void>;
}
export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
