import { DomainPrimitiveProperties, ValueObject, ValueObjectProperties } from '@beincom/domain';

export class UserName extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public validate(properties: DomainPrimitiveProperties<string>): void {
    //
  }

  public static fromString(value: string): UserName {
    return new UserName({ value });
  }
}
