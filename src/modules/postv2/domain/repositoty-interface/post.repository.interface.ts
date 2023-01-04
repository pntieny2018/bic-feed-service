import { PaginationProps } from '../../../../common/types/pagination-props.type ';
import { PostType } from '../../data-type';
import { Post } from '../model/post';

export type FindOnePostProps = {
  id: string;
  type?: PostType;
};

export type FindAllPostsProps = {
  groupIds: string[];
};

export type GetPaginationTagProps = PaginationProps & {
  groupIds: string[];
  name?: string;
};
export interface ITagRepository {
  findOne(input: FindOnePostProps): Promise<Post>;
  findAll(input: FindAllPostsProps): Promise<Post[]>;
  update(data: Post): Promise<void>;
  create(data: Post): Promise<void>;
  delete(id: string): Promise<void>;
}

export const POST_REPOSITORY = 'POST_REPOSITORY';
