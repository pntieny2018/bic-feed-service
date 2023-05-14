import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

export type PublishPostCommandPayload = {
  id: string;
  groupIds: string[];
  authUser: UserDto;
  content?: string;
  tagIds?: string[];
  seriesIds?: string[];
  mentionUserIds?: string[];
  setting?: {
    canComment: boolean;
    canShare: boolean;
    canReact: boolean;
    isImportant: boolean;
    importantExpiredAt: Date;
  };
  linkPreview?: {
    url: string;
    domain: string;
    image: string;
    title: string;
    description: string;
  };
  media?: {
    files: {
      id: string;
    };
    images: {
      id: string;
    };
    videos: {
      id: string;
    };
  };
};
export class PublishPostCommand implements ICommand {
  public constructor(public readonly payload: PublishPostCommandPayload) {}
}
