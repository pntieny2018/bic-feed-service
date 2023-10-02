import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

import { LinkPreviewDto, MediaDto } from '../../../application/dto';
import { PostEntity } from '../../model/content';

export type PostPayload = {
  id: string;
  content?: string;
  seriesIds?: string[];
  tagIds?: string[];
  groupIds?: string[];
  media?: MediaDto;
  mentionUserIds?: string[];
  linkPreview?: LinkPreviewDto;
};

export type PostCreateProps = {
  groups: GroupDto[];
  userId: string;
};

export type UpdatePostProps = {
  payload: PostPayload;
  authUser: UserDto;
};

export type SchedulePostProps = {
  payload: PostPayload & { scheduledAt: Date };
  actor: UserDto;
};

export type PublishPostProps = {
  payload: PostPayload;
  actor: UserDto;
};

export interface IPostDomainService {
  getPostById(postId: string, authUserId: string): Promise<PostEntity>;
  createDraftPost(input: PostCreateProps): Promise<PostEntity>;
  schedule(input: SchedulePostProps): Promise<PostEntity>;
  publish(input: PublishPostProps): Promise<PostEntity>;
  updatePost(props: UpdatePostProps): Promise<PostEntity>;
  autoSavePost(input: UpdatePostProps): Promise<void>;
  delete(postId: string, authUser: UserDto): Promise<void>;
}

export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
