import { TagAttributes, TagModel } from '@app/database/postgres/model/tag.model';

export type FindOneTagProps = {
  name?: string;
  id?: string;
  groupId?: string;
};

export type FindAllTagsProps = {
  ids?: string[];
  groupIds?: string[];
  name?: string;
};

export interface ILibTagRepository {
  findOne(input: FindOneTagProps): Promise<TagModel>;

  findAll(input: FindAllTagsProps): Promise<TagModel[]>;

  update(tagId: string, tag: Partial<TagAttributes>): Promise<void>;

  create(data: TagAttributes): Promise<void>;

  delete(id: string): Promise<void>;
}

export const LIB_TAG_REPOSITORY_TOKEN = 'LIB_TAG_REPOSITORY_TOKEN';
