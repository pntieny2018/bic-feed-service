import { UUID, ValueObjectProperties } from '@beincom/domain';

export class CommunityId extends UUID {
  public constructor(props: ValueObjectProperties<string>) {
    super(props);
  }

  public static fromString(value: string): CommunityId {
    return new CommunityId({ value });
  }
}
