import { AudienceResponseDto } from '../responses/audience.response.dto';
import { PostSettingDto } from '../common/post-setting.dto';

export class PostSearchBodyDto {
  public id?: number;
  public actor: number;
  public audience: AudienceResponseDto;
  public data: {
    content: string;
    highlight?: string;
  };
  public setting?: PostSettingDto;
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
