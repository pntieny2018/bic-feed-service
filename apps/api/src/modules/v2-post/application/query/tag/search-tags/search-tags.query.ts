import { IQuery } from '@nestjs/cqrs';

type Props = {
  keyword: string;
};
export class SearchTagsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
