import { PostType } from '../../../data-type';

export class FindItemsBySeriesDto {
  public series: {
    id: string;
    title: string;
    summary: string;
    items: {
      id: string;
      title: string;
      type: PostType;
    }[];
  }[];
  public constructor(data: FindItemsBySeriesDto) {
    Object.assign(this, data);
  }
}
