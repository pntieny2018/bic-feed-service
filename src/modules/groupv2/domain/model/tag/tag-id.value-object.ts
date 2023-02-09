import { UUID, ValueObjectProperties } from '@beincom/domain';

export class TagId extends UUID {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): TagId {
    return new TagId({ value });
  }
}
