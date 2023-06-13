import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';
import { PostSettingDto } from '../../dto';

export type UpdatePostCommandPayload = {
  id: string;
  groupIds: string[];
  authUser: UserDto;
  content?: string;
  tagIds?: string[];
  seriesIds?: string[];
  mentionUserIds?: string[];
  setting?: PostSettingDto;
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
export class UpdatePostCommand implements ICommand {
  public constructor(public readonly payload: UpdatePostCommandPayload) {}
}
