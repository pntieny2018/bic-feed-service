import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

import { UpdatePostCommandPayload } from '../../../application/command/post';
import { LinkPreviewDto, MediaDto } from '../../../application/dto';
import { PostEntity, ArticleEntity } from '../../model/content';

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

export type ArticleCreateProps = {
  groups?: GroupDto[];
  userId: string;
};

// TODO: refactor using PostPayload
export type UpdatePostProps = UpdatePostCommandPayload;

export type SchedulePostProps = {
  payload: PostPayload & { scheduledAt: Date };
  actor: UserDto;
};

export interface IPostDomainService {
  getPostById(postId: string, authUserId: string): Promise<PostEntity>;
  createDraftPost(input: PostCreateProps): Promise<PostEntity>;
  createDraftArticle(input: ArticleCreateProps): Promise<ArticleEntity>;
  schedule(input: SchedulePostProps): Promise<PostEntity>;
  publishPost(input: UpdatePostProps): Promise<PostEntity>;
  updatePost(props: UpdatePostProps): Promise<PostEntity>;
  updateSetting(input: {
    contentId: string;
    authUser: UserDto;
    canComment: boolean;
    canReact: boolean;
    isImportant: boolean;
    importantExpiredAt: Date;
  }): Promise<void>;
  autoSavePost(input: UpdatePostProps): Promise<void>;
  markSeen(contentId: string, userId: string): Promise<void>;
  markReadImportant(contentId: string, userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
