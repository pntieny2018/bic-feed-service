import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class GroupIcon extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public validate(properties: ValueObjectProperties<string>): void {
    //
  }
  public static fromString(value: string): GroupIcon {
    return new GroupIcon({ value });
  }
}
