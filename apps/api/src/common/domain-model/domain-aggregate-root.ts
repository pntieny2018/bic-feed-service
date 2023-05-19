import equal from 'fast-deep-equal';
import { AggregateRoot } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

export type EntityProperties<T> = {
  [K in keyof T]: T[K];
};

export abstract class DomainAggregateRoot<
  Props extends EntityProperties<any> = EntityProperties<any>
> extends AggregateRoot {
  protected _props: Props;
  protected _snapshot: object;
  protected _logger = new Logger('DomainAggregateRoot');

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
    const props = { ...this._props };
    const snapshot = { ...this._snapshot };
    delete props['updatedAt'];
    delete snapshot['updatedAt'];
    this._logger.debug(JSON.stringify(props), '_prop');
    this._logger.debug(JSON.stringify(snapshot), '_snapshot');
    return !equal(props, snapshot);
  }

  public get<K extends keyof Props>(key: K): Props[K] {
    return this._props[key];
  }

  public toObject(): Props {
    return this._props;
  }
}
