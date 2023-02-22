export type EntityProperties<T> = {
  [K in keyof T]: T[K];
};

export abstract class DomainModel<Props extends EntityProperties<any> = EntityProperties<any>> {
  protected _props: Props;
  protected _snapshot: object;
}
