import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type RecentSearchProps = {
  id: string;
  createdBy: string;
  updatedBy: string;
  target: string;
  keyword: string;
  totalSearched: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export class RecentSearchEntity extends DomainAggregateRoot<RecentSearchProps> {
  public constructor(props: RecentSearchProps) {
    super(props);
  }

  public validate(): void {
    if (!this._props.id) {
      throw new DomainModelException(`Recent Search ID is not UUID`);
    }
  }

  public update(props: Partial<RecentSearchProps>): void {
    const { keyword, totalSearched, updatedBy } = props;
    this._props.keyword = keyword;
    this._props.totalSearched = totalSearched;
    this._props.updatedBy = updatedBy;
  }
}
