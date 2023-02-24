import equal from 'fast-deep-equal';
import { AggregateRoot } from '@nestjs/cqrs';
import { ClassTransformer } from 'class-transformer';

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
      this._snapshot = { ...this._props };
    }
  }

  public isChanged(): boolean {
    return !equal(this._props, this._snapshot);
  }

  public get<K extends keyof Props>(key: K): Props[K] {
    return this._props[key];
  }
}
