import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export class TagTotalUsed extends ValueObject<number> {
  public constructor(props: ValueObjectProperties<number>) {
    super(props);
  }

  public static fromString(value: number): TagTotalUsed {
    return new TagTotalUsed({ value });
  }

  public validate(props: ValueObjectProperties<number>): void {
    if (props.value < 0) {
      throw new DomainModelException(`Total used must be >= 0`);
    }
  }
}
