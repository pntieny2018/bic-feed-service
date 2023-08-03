import { UserDto } from '../../../../../v2-user/application';

export type MediaDto = {
  id: string;
};

export type ArticleDto = {
  id: string;
  actor: UserDto;
  title?: string;
  summary?: string;
  content?: string;
  categories?: string[];
  series?: string[];
  tags?: string[];
  groupIds?: string[];
  coverMedia?: MediaDto;
  wordCount?: number;
  scheduledAt?: Date;
};

export type PostSettingDto = {
  canComment: boolean;
  canReact: boolean;
  isImportant: boolean;
  importantExpiredAt?: Date;
};

export type PublishPostDto = {
  id: string;
  groupIds: string[];
  authUser: UserDto;
  content?: string;
  tagIds?: string[];
  seriesIds?: string[];
  mentionUserIds?: string[];
  linkPreview?: {
    url: string;
    domain: string;
    image: string;
    title: string;
    description: string;
  };
  media?: {
    filesIds: string[];
    imagesIds: string[];
    videosIds: string[];
  };
};

export type UpdateSeriesDto = {
  actor: UserDto;
  id: string;
  groupIds?: string[];
  title?: string;
  summary?: string;
  coverMedia?: MediaDto;
};
