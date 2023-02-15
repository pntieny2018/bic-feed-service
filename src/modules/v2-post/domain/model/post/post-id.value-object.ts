import { UUID, ValueObjectProperties } from '@beincom/domain';

export class PostId extends UUID {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): PostId {
    return new PostId({ value });
  }
}
