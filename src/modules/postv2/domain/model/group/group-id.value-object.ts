import { UUID, ValueObjectProperties } from '@beincom/domain';

export class GroupId extends UUID {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): GroupId {
    return new GroupId({ value });
  }
}
