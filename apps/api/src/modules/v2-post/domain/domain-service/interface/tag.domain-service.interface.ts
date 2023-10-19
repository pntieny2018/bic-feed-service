import { ArticleEntity, PostEntity } from '../../model/content';
import { TagEntity } from '../../model/tag';

export type TagCreateProps = {
  name: string;
  groupId: string;
  userId: string;
};

export type TagUpdateProps = {
  name: string;
  userId: string;
};

export interface ITagDomainService {
  findByIds(ids: string[]): Promise<TagEntity[]>;
  createTag(data: TagCreateProps): Promise<TagEntity>;
  updateTag(tag: TagEntity, data: TagUpdateProps): Promise<TagEntity>;
  deleteTag(tag: TagEntity): Promise<void>;
  increaseTotalUsedByContent(content: PostEntity | ArticleEntity): Promise<void>;
  decreaseTotalUsedByContent(content: PostEntity | ArticleEntity): Promise<void>;
  updateTagsUsedByContent(content: PostEntity | ArticleEntity): Promise<void>;
}
export const TAG_DOMAIN_SERVICE_TOKEN = 'TAG_DOMAIN_SERVICE_TOKEN';
