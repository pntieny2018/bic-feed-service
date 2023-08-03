import { UserDto } from '../../../../../v2-user/application';

export type UpdateCommentDto = {
  id: string;

  actor: UserDto;

  content?: string;

  media?: {
    files: string[];
    images: string[];
    videos: string[];
  };

  mentions?: string[];

  giphyId?: string;
};
