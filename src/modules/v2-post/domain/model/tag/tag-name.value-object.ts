import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { TagEntity } from './tag.entity';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export class TagName extends ValueObject<string> {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): TagName {
    return new TagName({ value });
  }

  public validate(props: ValueObjectProperties<string>): void {
    if (!props.value) {
      throw new DomainModelException(`Tag name is required`);
    }
    if (props.value && props.value.length > TagEntity.TAG_NAME_MAX_LENGTH) {
      throw new DomainModelException(
        `Tag name must not exceed ${TagEntity.TAG_NAME_MAX_LENGTH} characters`
      );
    }
  }
}
