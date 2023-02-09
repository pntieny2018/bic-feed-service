import { UUID, ValueObjectProperties } from '@beincom/domain';

export class TagUpdatedBy extends UUID {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): TagUpdatedBy {
    return new TagUpdatedBy({ value });
  }
}
