import { UUID, ValueObjectProperties } from '@beincom/domain';

export class UserId extends UUID {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): UserId {
    return new UserId({ value });
  }
}
