import { TagEntity } from '../model/tag';

export type FindOneTagProps = {
  name?: string;
  id?: string;
  groupId?: string;
};

export type FindAllTagsProps = {
  groupIds: string[];
  name?: string;
};

export interface ITagRepository {
  findOne(input: FindOneTagProps): Promise<TagEntity>;

  findAll(input: FindAllTagsProps): Promise<TagEntity[]>;

  update(data: TagEntity): Promise<void>;

  create(data: TagEntity): Promise<void>;

  delete(id: string): Promise<void>;

  canCUDTag(userId: string, rootGroupId: string): Promise<boolean>;
}

export const TAG_REPOSITORY_TOKEN = 'TAG_REPOSITORY_TOKEN';
