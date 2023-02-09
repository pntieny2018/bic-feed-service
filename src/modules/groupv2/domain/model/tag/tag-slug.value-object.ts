import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class TagSlug extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): TagSlug {
    return new TagSlug({ value });
  }

  public validate(props) {
    // none...
  }
}
