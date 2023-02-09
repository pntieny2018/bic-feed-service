import { DomainPrimitiveProperties, ValueObject, ValueObjectProperties } from '@beincom/domain';

export class GroupName extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public validate(properties: DomainPrimitiveProperties<string>): void {
    //
  }

  public static fromString(value: string): GroupName {
    return new GroupName({ value });
  }
}
