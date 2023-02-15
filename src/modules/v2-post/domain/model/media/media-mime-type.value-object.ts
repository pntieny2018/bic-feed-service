import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { MediaEntity } from '.';

export class MediaMimeType extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): MediaMimeType {
    return new MediaMimeType({ value });
  }

  public validate(props: ValueObjectProperties<string>): void {
    if (props.value && props.value.length > MediaEntity.MEDIA_MIME_TYPE_MAX_LENGTH) {
      throw new IllegalArgumentException(
        `Media mime type must not exceed ${MediaEntity.MEDIA_MIME_TYPE_MAX_LENGTH} characters`
      );
    }
  }
}
