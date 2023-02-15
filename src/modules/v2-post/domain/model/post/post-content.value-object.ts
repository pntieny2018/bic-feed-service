import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class PostContent extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): PostContent {
    return new PostContent({ value });
  }

  public validate(props: ValueObjectProperties<string>): void {
    //none
  }
}
