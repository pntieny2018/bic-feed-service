import { CONTENT_STATUS } from '@beincom/constants';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

import { LinkPreviewDto, MediaRequestDto } from '../../../application/dto';
import { PostEntity } from '../../model/content';

export type PostPayload = {
  id: string;
  content?: string;
  seriesIds?: string[];
  tagIds?: string[];
  groupIds?: string[];
  media?: MediaRequestDto;
  mentionUserIds?: string[];
  linkPreview?: LinkPreviewDto;
  status?: CONTENT_STATUS;
};

export type PostCreateProps = {
  groups: GroupDto[];
  userId: string;
};

export type UpdatePostProps = {
  payload: PostPayload;
  actor: UserDto;
};

export type UpdateVideoProcessProps = {
  id: string;
  media: MediaRequestDto;
  actor: UserDto;
  status?: CONTENT_STATUS;
  isVideoProcessFailed?: boolean;
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
  update(props: UpdatePostProps): Promise<PostEntity>;
  updateVideoProcess(props: UpdateVideoProcessProps): Promise<void>;
  autoSavePost(input: UpdatePostProps): Promise<void>;
  delete(postId: string, authUser: UserDto): Promise<void>;
}

export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
