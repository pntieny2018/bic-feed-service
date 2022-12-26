import { ITag } from '../model/tag/tag.entity';

export type GetTagListProps = {
  name?: string;
  groupIds: string[];
  offset: number;
  limit: number;
};

export const TAG_REPOSITORY = 'TAG_REPOSITORY';
export interface ITagRepository {
  getList(input: GetTagListProps): () => ITag[];
  create(data: ITag): () => void;
  update(data: ITag): () => void;
  delete(id: string): () => void;
}
