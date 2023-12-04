import { ORDER } from '@beincom/constants';

export type CursorPaginationProps = {
  limit: number;
  before?: string;
  after?: string;
  order?: ORDER;
  sortColumns?: string[];
};
