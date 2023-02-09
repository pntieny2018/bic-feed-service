import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { GROUP_PRIVACY } from '../../../data-type';

export class GroupPrivacy extends ValueObject<GROUP_PRIVACY> {
  public constructor(props: ValueObjectProperties<GROUP_PRIVACY>) {
    super(props);
  }

  public validate(props: ValueObjectProperties<GROUP_PRIVACY>): void {
    //
  }
  public static fromString(value: GROUP_PRIVACY): GroupPrivacy {
    return new GroupPrivacy({ value });
  }
}
