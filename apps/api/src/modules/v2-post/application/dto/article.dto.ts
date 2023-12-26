import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';
import { PickType } from '@nestjs/swagger';

import { ImageDto, MediaDto } from './media.dto';
import { PostSettingDto } from './post.dto';
import { QuizDto } from './quiz.dto';
import { OwnerReactionDto, ReactionCount } from './reaction.dto';
import { ReportReasonCountDto } from './report.dto';
import { SeriesInContentDto } from './series.dto';
import { TagDto } from './tag.dto';
import { UserMentionDto } from './user-mention.dto';

export class ArticleDto {
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
  public isSeen?: boolean;
  public ownerReactions: OwnerReactionDto[];
  public reactionsCount: ReactionCount[];
  public publishedAt?: Date;
  public scheduledAt?: Date;
  public audience: { groups: GroupDto[] }; // groupIds
  public communities: GroupDto[]; // communityIds
  public wordCount: number;
  public commentsCount: number;
  public totalUsersSeen: number;
  public content: string;
  public summary: string;
  public title: string;
  public mentions: UserMentionDto; // mentionUserIds
  public categories: { id: string; name: string }[];
  public coverMedia: ImageDto;
  public series: SeriesInContentDto[]; // seriesIds
  public tags: TagDto[];
  public quiz?: QuizDto;
  public quizHighestScore?: { quizParticipantId: string; score: number };
  public quizDoing?: { quizParticipantId: string };
  public highlight?: string;
  public titleHighlight?: string;
  public summaryHighlight?: string;
  public reportReasonsCount?: ReportReasonCountDto[];

  public constructor(data: Partial<ArticleDto>) {
    Object.assign(this, data);
  }
}

export class ArticleInSeriesDto extends PickType(ArticleDto, [
  'id',
  'title',
  'summary',
  'type',
  'createdBy',
  'createdAt',
  'publishedAt',
  'setting',
  'actor',
  'isSaved',
  'coverMedia',
  'categories',
  'audience',
]) {
  public constructor(data: Partial<ArticleInSeriesDto>) {
    super(data);
  }
}
