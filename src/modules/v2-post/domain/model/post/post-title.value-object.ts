import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class PostTitle extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): PostTitle {
    return new PostTitle({ value });
  }

  public validate(props: ValueObjectProperties<string>): void {
    //none
  }
}
