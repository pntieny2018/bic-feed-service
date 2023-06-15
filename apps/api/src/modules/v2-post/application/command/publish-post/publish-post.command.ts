import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';
import { PostSettingDto } from '../../dto';

export type PublishPostCommandPayload = {
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
export class PublishPostCommand implements ICommand {
  public constructor(public readonly payload: PublishPostCommandPayload) {}
}
