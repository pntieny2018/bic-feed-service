import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class MediaSize extends ValueObject<number> {
  public constructor(props: ValueObjectProperties<number>) {
    super(props);
  }

  public static fromString(value: number): MediaSize {
    return new MediaSize({ value });
  }

  public validate(props: ValueObjectProperties<number>): void {
    if (props.value < 0) {
      throw new IllegalArgumentException(`The size must be >= 0`);
    }
  }
}
