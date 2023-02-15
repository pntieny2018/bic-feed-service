import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class PostCommentsCount extends ValueObject<number> {
  public constructor(props: ValueObjectProperties<number>) {
    super(props);
  }

  public static fromString(value: number): PostCommentsCount {
    return new PostCommentsCount({ value });
  }

  public validate(props: ValueObjectProperties<number>): void {
    if (props.value < 0) {
      throw new IllegalArgumentException(`Total comment must be >= 0`);
    }
  }
}
