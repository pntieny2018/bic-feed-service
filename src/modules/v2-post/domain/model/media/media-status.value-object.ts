import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { MEDIA_STATUS } from '../../../data-type';

export class MediaStatus extends ValueObject<MEDIA_STATUS> {
  public constructor(props: ValueObjectProperties<MEDIA_STATUS>) {
    super(props);
  }

  public static fromString(value: MEDIA_STATUS): MediaStatus {
    return new MediaStatus({ value });
  }

  public validate(props: ValueObjectProperties<MEDIA_STATUS>): void {
    if (!MEDIA_STATUS[props.value]) {
      throw new IllegalArgumentException(`Media status ${props.value} is invalid`);
    }
  }
}
