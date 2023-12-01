import { ReactionsCount } from '@api/common/types';
import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';
import { PickType } from '@nestjs/swagger';

import { LinkPreviewDto } from './link-preview.dto';
import { MediaDto } from './media.dto';
import { QuizDto } from './quiz.dto';
import { OwnerReactionDto } from './reaction.dto';
import { ReportReasonCountDto } from './report.dto';
import { SeriesInContentDto } from './series.dto';
import { TagDto } from './tag.dto';
import { UserMentionDto } from './user-mention.dto';

export class PostDto {
  public id: string;
  public isReported: boolean;
  public isHidden: boolean;
  public createdBy?: string;
  public actor: UserDto; // createdBy
  public privacy: PRIVACY;
  public status: CONTENT_STATUS;
  public type: CONTENT_TYPE;
  public setting: PostSettingDto;
  public media: MediaDto;
  public createdAt: Date;
  public updatedAt: Date;
  public markedReadPost: boolean; // markedReadImportant
  public isSaved: boolean;
  public ownerReactions: OwnerReactionDto[];
  public reactionsCount: ReactionsCount;
  public publishedAt?: Date;
  public scheduledAt?: Date;
  public audience: { groups: GroupDto[] }; // groupIds
  public communities: GroupDto[]; // communityIds
  public wordCount: number;
  public commentsCount: number;
  public totalUsersSeen: number;
  public title: string;
  public content: string;
  public mentions: UserMentionDto; // mentionUserIds
  public linkPreview?: LinkPreviewDto;
  public series: SeriesInContentDto[]; // seriesIds
  public tags: TagDto[];
  public quiz?: QuizDto;
  public quizHighestScore?: { quizParticipantId: string; score: number };
  public quizDoing?: { quizParticipantId: string };
  public highlight?: string;
  public titleHighlight?: string;
  public summaryHighlight?: string;
  public reportReasonsCount?: ReportReasonCountDto[];

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

export class PostInSeriesDto extends PickType(PostDto, [
  'id',
  'content',
  'createdBy',
  'createdAt',
  'publishedAt',
  'setting',
  'type',
  'actor',
  'isSaved',
  'media',
  'audience',
]) {
  public constructor(data: Partial<PostInSeriesDto>) {
    super(data);
  }
}

export class ItemInSeries {
  public id: string;
  public title: string;
  public createdBy: string;
  public type: CONTENT_TYPE;

  public constructor(data: Partial<ItemInSeries>) {
    Object.assign(this, data);
  }
}
