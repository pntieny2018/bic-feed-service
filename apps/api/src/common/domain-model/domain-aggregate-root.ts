import { AggregateRoot } from '@nestjs/cqrs';
import { cloneDeep, isEqual, omit } from 'lodash';

export type EntityProperties<T> = {
  [K in keyof T]: T[K];
};

export abstract class DomainAggregateRoot<
  Props extends EntityProperties<any> = EntityProperties<any>
> extends AggregateRoot {
  protected _props: Props;
  protected _snapshot: object;

  protected constructor(props: Props) {
    super();
    this._props = props;
    this.validate();
    this.createSnapShot();
  }

  public abstract validate(): void | never;

  protected createSnapShot(): void {
    if (!this._snapshot) {
      this._snapshot = cloneDeep(this._props);
    }
  }

  public isChanged(): boolean {
    const props = cloneDeep(this._props);
    const snapshot = cloneDeep(this._snapshot);
    const excluded = ['updatedAt'];
    return !isEqual(omit(props, excluded), omit(snapshot, excluded));
  }

  public get<K extends keyof Props>(key: K): Props[K] {
    return this._props[key];
  }

  public toObject(): Props {
    return this._props;
  }
}
