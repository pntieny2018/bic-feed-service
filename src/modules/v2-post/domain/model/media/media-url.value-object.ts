import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class MediaUrl extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): MediaUrl {
    return new MediaUrl({ value });
  }

  public validate(props: ValueObjectProperties<string>): void {
    //none
  }
}
