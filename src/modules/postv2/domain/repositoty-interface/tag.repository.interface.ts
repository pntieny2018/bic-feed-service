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
  findOne(id: string): Promise<ITag>;
  getList(input: GetTagListProps): Promise<GetTagListResult>;
  save(data: ITag): Promise<void>;
  delete(id: string): Promise<void>;
}
