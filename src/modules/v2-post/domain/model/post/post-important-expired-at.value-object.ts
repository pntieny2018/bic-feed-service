import { DateVO, ValueObjectProperties } from '@beincom/domain';

export class PostImportantExpiredAt extends DateVO {
  public constructor(props: ValueObjectProperties<Date>) {
    super(props);
  }
}
