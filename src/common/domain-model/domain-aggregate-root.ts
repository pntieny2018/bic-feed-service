import { DeepEqual } from 'deep-equal';
import { AggregateRoot } from '@nestjs/cqrs';

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

  protected createSnapShot() {
    if (!this._snapshot) {
      this._snapshot = this._props.toObject();
    }
  }

  public isChanged(): boolean {
    return !DeepEqual(this._props.toObject(), this._snapshot);
  }

  public get<K extends keyof Props>(key: K): Props[K] {
    return this._props[key];
  }
}
