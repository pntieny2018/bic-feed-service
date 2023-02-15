import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { isBoolean } from 'class-validator';

interface Constructor<T> {
  new (...args: any[]): T;
}

export class BooleanValueObject extends ValueObject<boolean> {
  public constructor(props: ValueObjectProperties<boolean>) {
    super(props);
  }

  public validate({ value }: ValueObjectProperties<false> | ValueObjectProperties<true>): void {
    if (!isBoolean(value)) {
      throw new IllegalArgumentException('Invalid boolean value');
    }
  }

  public static fromBoolean<T extends BooleanValueObject>(
    this: Constructor<T>,
    value: boolean
  ): BooleanValueObject {
    return new this({ value });
  }
}
