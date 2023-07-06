import { OrderEnum } from '../dto';

export type CursorPaginationProps = {
  limit: number;
  before?: string;
  after?: string;
  order?: OrderEnum;
};
