import { DomainPrimitiveProperties, ValueObject, ValueObjectProperties } from '@beincom/domain';

export class UserFullName extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public validate(properties: DomainPrimitiveProperties<string>): void {
    //
  }

  public static fromString(value: string): UserFullName {
    return new UserFullName({ value });
  }
}
