import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class PostSummary extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): PostSummary {
    return new PostSummary({ value });
  }

  public validate(props: ValueObjectProperties<string>): void {
    //none
  }
}
