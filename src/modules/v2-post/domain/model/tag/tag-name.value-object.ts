import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { TagEntity } from './tag.entity';

export class TagName extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): TagName {
    return new TagName({ value });
  }

  public validate(props: ValueObjectProperties<string>): void {
    if (props.value && props.value.length > TagEntity.TAG_NAME_MAX_LENGTH) {
      throw new IllegalArgumentException(
        `Tag name must not exceed ${TagEntity.TAG_NAME_MAX_LENGTH} characters`
      );
    }
  }
}
