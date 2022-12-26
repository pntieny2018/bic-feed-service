import { ITag } from '../model/tag/tag';

export type GetTagListProps = {
  name?: string;
  groupIds: string[];
  offset: number;
  limit: number;
};

export type GetTagListResult = {
  rows: ITag[];
  total: number;
};

export const TAG_REPOSITORY = 'TAG_REPOSITORY';
export interface ITagRepository {
  getList(input: GetTagListProps): Promise<GetTagListResult>;
  create(data: ITag): Promise<void>;
  update(data: ITag): Promise<void>;
  delete(id: string): Promise<void>;
}
