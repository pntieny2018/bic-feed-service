import { CONTENT_TYPE } from '@beincom/constants';
export class WelcomeContentDto {
  public title: string;
  public list: {
    id: string;
    title: string;
    type: CONTENT_TYPE;
    isSeen: boolean;
  }[];

  public constructor(data: Partial<WelcomeContentDto>) {
    Object.assign(this, data);
  }
}
