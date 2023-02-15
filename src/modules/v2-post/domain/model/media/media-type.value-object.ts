import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { MEDIA_TYPE } from '../../../data-type';

export class MediaType extends ValueObject<MEDIA_TYPE> {
  public constructor(props: ValueObjectProperties<MEDIA_TYPE>) {
    super(props);
  }

  public static fromString(value: MEDIA_TYPE): MediaType {
    return new MediaType({ value });
  }

  public validate(props: ValueObjectProperties<MEDIA_TYPE>): void {
    if (!MEDIA_TYPE[props.value]) {
      throw new IllegalArgumentException(`Media type ${props.value} is invalid`);
    }
  }
}
