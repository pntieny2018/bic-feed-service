import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class MediaHeight extends ValueObject<number> {
  public constructor(props: ValueObjectProperties<number>) {
    super(props);
  }

  public static fromString(value: number): MediaHeight {
    return new MediaHeight({ value });
  }

  public validate(props: ValueObjectProperties<number>): void {
    if (props.value < 0) {
      throw new IllegalArgumentException(`The height must be >= 0`);
    }
  }
}
