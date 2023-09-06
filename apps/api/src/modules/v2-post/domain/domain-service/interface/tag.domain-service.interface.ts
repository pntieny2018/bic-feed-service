import { TagEntity } from '../../model/tag';

export type TagCreateProps = {
  name: string;
  groupId: string;
  userId: string;
};

export type TagUpdateProps = {
  name: string;
  id: string;
  userId: string;
};

export interface ITagDomainService {
  createTag(data: TagCreateProps): Promise<TagEntity>;

  updateTag(tag: TagEntity, data: TagUpdateProps): Promise<TagEntity>;

  deleteTag(id: string): Promise<void>;

  findTagsByKeyword(keyword: string): Promise<TagEntity[]>;
}
export const TAG_DOMAIN_SERVICE_TOKEN = 'TAG_DOMAIN_SERVICE_TOKEN';
