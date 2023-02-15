import { UUID, ValueObjectProperties } from '@beincom/domain';

export class MediaId extends UUID {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): MediaId {
    return new MediaId({ value });
  }
}
