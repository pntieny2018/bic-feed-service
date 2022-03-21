import { AudienceDto } from '../common/audience.dto';
import { PostSettingDto } from '../common/post-setting.dto';

export class PostSearchBodyDto {
  public id?: number;
  public actor: number;
  public audience: AudienceDto;
  public data: {
    content: string;
    highlight?: string;
  };
  public setting?: PostSettingDto;
}

export class FilterPostSearchDto {
  public id?: number;
  public actors?: string[];
  public audience?: AudienceDto;
  public data?: {
    content?: string;
  };
  public important?: boolean;
  public startTime?: string;
  public endTime?: string;
  public offset?: number;
  public limit?: number;
}

export interface IPostSearchResultDto {
  hits: {
    total: { value: number };
    hits: Array<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _id: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _source: PostSearchBodyDto;
      highlight?: { [key: string]: string[] };
    }>;
  };
}
