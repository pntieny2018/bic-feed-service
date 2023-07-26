import { PostSettingDto } from './post-setting.dto';
import { GroupDto } from '../../../v2-group/application';
import { PostStatus } from '../../data-type/post-status.enum';
import { UserDto } from '../../../v2-user/application';
import { PostPrivacy, PostType } from '../../data-type';
import { UserMentionDto } from './user-mention.dto';
import { TagDto } from './tag.dto';
import { ImageDto } from './image.dto';
import { QuizDto } from './quiz.dto';

export class ArticleDto {
  public id: string;
  public audience: {
    groups: GroupDto[];
  };
  public communities: GroupDto[];
  public content: string;
  public summary: string;
  public title: string;
  public categories: {
    id: string;
    name: string;
  }[];
  public tags: TagDto[];
  public series: {
    title: string;
    id: string;
  }[];
  public quiz?: QuizDto;
  public setting: PostSettingDto;
  public actor: UserDto;
  public status: PostStatus;
  public privacy: PostPrivacy;
  public type: PostType;
  public markedReadPost: boolean;
  public isSaved: boolean;
  public isReported: boolean;
  public mentions: UserMentionDto;
  public commentsCount: number;
  public totalUsersSeen: number;
  public wordCount: number;
  public coverMedia: ImageDto;
  public reactionsCount: Record<string, number>[];
  public ownerReactions: {
    id: string;
    reactionName: string;
  }[];
  public createdAt: Date;
  public updatedAt: Date;
  public scheduledAt?: Date;
  public publishedAt?: Date;

  public constructor(data: Partial<ArticleDto>) {
    Object.assign(this, data);
  }
}
