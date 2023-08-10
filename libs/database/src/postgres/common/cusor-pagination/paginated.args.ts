import { IPaginationArgs } from '@app/database/postgres/common';

export const PAGING_DEFAULT_LIMIT = 10;

export class PaginatedArgs implements IPaginationArgs {
  public limit = PAGING_DEFAULT_LIMIT;

  public before?: string;

  public after?: string;
}
