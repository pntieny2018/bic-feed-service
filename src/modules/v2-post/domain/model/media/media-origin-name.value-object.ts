import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { MediaEntity } from './media.entity';

export class MediaOriginName extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): MediaOriginName {
    return new MediaOriginName({ value });
  }

  public validate(props: ValueObjectProperties<string>): void {
    if (props.value && props.value.length > MediaEntity.MEDIA_NAME_MAX_LENGTH) {
      throw new IllegalArgumentException(
        `Media name must not exceed ${MediaEntity.MEDIA_NAME_MAX_LENGTH} characters`
      );
    }
  }
}
