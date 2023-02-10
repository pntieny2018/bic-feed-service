import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class UserAvatar extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public validate(properties: ValueObjectProperties<string>): void {
    //
  }
  public static fromString(value: string): UserAvatar {
    return new UserAvatar({ value });
  }
}
