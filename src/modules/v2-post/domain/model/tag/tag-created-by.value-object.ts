import { UUID, ValueObjectProperties } from '@beincom/domain';

export class TagCreatedBy extends UUID {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): TagCreatedBy {
    return new TagCreatedBy({ value });
  }
}
