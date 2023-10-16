import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

import { PostPrivacy, PostStatus, PostType } from '../../data-type';

import { LinkPreviewDto } from './link-preview.dto';
import { FileDto, ImageDto, VideoDto } from './media.dto';
import { QuizDto } from './quiz.dto';
import { TagDto } from './tag.dto';
import { UserMentionDto } from './user-mention.dto';

export class PostDto {
  public id: string;
  public audience: {
    groups: GroupDto[];
  };
  public communities: GroupDto[];
  public content: string;
  public tags: TagDto[];
  public series: {
    title: string;
    id: string;
  }[];
  public quiz?: QuizDto;
  public setting: PostSettingDto;
  public linkPreview?: LinkPreviewDto;
  public media: {
    files: FileDto[];
    images: ImageDto[];
    videos: VideoDto[];
  };
  public actor: UserDto;
  public status: PostStatus | CONTENT_STATUS;
  public privacy: PostPrivacy | PRIVACY;
  public type: PostType | CONTENT_TYPE;
  public markedReadPost: boolean;
  public isSaved: boolean;
  public isReported: boolean;
  public mentions: UserMentionDto;
  public commentsCount: number;
  public totalUsersSeen: number;
  public wordCount: number;
  public reactionsCount: Record<string, number>[];
  public ownerReactions: {
    id: string;
    reactionName: string;
  }[];
  public createdAt: Date;
  public updatedAt: Date;
  public scheduledAt?: Date;
  public publishedAt?: Date;
  public quizHighestScore?: {
    quizParticipantId: string;
    score: number;
  };
  public quizDoing?: {
    quizParticipantId: string;
  };
  public highlight?: string;
  public titleHighlight?: string;
  public summaryHighlight?: string;

  public constructor(data: Partial<PostDto>) {
    Object.assign(this, data);
  }
}

export class PostSettingDto {
  public canComment: boolean;
  public canReact: boolean;
  public isImportant: boolean;
  public importantExpiredAt?: Date;

  public constructor(data: Partial<PostSettingDto>) {
    Object.assign(this, data);
  }
}

export class CreateDraftPostDto {
  public id: string;
  public audience: {
    groups: GroupDto[];
  };

  public setting: PostSettingDto;

  public constructor(data: Partial<CreateDraftPostDto>) {
    Object.assign(this, data);
  }
}
