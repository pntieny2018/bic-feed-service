import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { POST_LANG } from '../../../data-type/post-lang.enum';

export class PostLang extends ValueObject<POST_LANG> {
  public constructor(props: ValueObjectProperties<POST_LANG>) {
    super(props);
  }

  public static fromString(value: POST_LANG): PostLang {
    return new PostLang({ value });
  }

  public validate(props: ValueObjectProperties<POST_LANG>): void {
    if (!POST_LANG[props.value]) {
      throw new IllegalArgumentException(`Lang ${props.value} is not support`);
    }
  }
}
