import { PostType } from '../../v2-post/data-type';

export interface IPostSearchQuery {
  actors?: string[];

  keyword?: string;

  tags?: string[];

  topics?: string[];

  startTime?: string;

  endTime?: string;

  groupIds?: string[];

  contentTypes?: PostType[];

  excludeByIds?: string[];
}
