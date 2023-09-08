import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type UpdatePostCommandPayload = {
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
export class UpdatePostCommand implements ICommand {
  public constructor(public readonly payload: UpdatePostCommandPayload) {}
}
