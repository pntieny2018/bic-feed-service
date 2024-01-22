import { LinkPreviewDto } from '@api/modules/v2-post/application/dto/link-preview.dto';
import { ImageDto, MediaDto } from '@api/modules/v2-post/application/dto/media.dto';
import { PostSettingDto } from '@api/modules/v2-post/application/dto/post.dto';
import { QuizDto } from '@api/modules/v2-post/application/dto/quiz.dto';
import { ReactionCount } from '@api/modules/v2-post/application/dto/reaction.dto';
import { TagDto } from '@api/modules/v2-post/application/dto/tag.dto';
import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';

export class ArticleCacheDto {
  public id: string;
  public isReported: boolean;
  public isHidden: boolean;
  public createdBy: string;
  public updatedBy: string;
  public privacy: PRIVACY;
  public status: CONTENT_STATUS;
  public type: CONTENT_TYPE;
  public setting: PostSettingDto;
  public media: MediaDto;
  public createdAt: Date;
  public updatedAt: Date;
  public publishedAt: Date;
  public groupIds: string[];
  public title: string;
  public content: string;
  public summary: string;
  public reactionsCount: ReactionCount;
  public wordCount: number;
  public commentsCount: number;
  public totalUsersSeen: number;
  public categories: { id: string; name: string }[];
  public coverMedia: ImageDto;
  public seriesIds: string[];
  public tags: TagDto[];
  public quiz?: QuizDto;

  public constructor(data: ArticleCacheDto) {
    Object.assign(this, data);
  }
}

export class PostCacheDto {
  public id: string;
  public isReported: boolean;
  public isHidden: boolean;
  public createdBy: string;
  public updatedBy: string;
  public privacy: PRIVACY;
  public status: CONTENT_STATUS;
  public type: CONTENT_TYPE;
  public setting: PostSettingDto;
  public media: MediaDto;
  public createdAt: Date;
  public updatedAt: Date;
  public publishedAt: Date;
  public groupIds: string[];
  public title: string;
  public content: string;
  public reactionsCount: ReactionCount;
  public commentsCount: number;
  public totalUsersSeen: number;
  public mentionsUserIds: string[];
  public seriesIds: string[];
  public tags: TagDto[];
  public linkPreview?: LinkPreviewDto;
  public quiz?: QuizDto;

  public constructor(data: PostCacheDto) {
    Object.assign(this, data);
  }
}

export class SeriesCacheDto {
  public id: string;
  public isReported: boolean;
  public isHidden: boolean;
  public createdBy: string;
  public updatedBy: string;
  public privacy: PRIVACY;
  public status: CONTENT_STATUS;
  public type: CONTENT_TYPE;
  public setting: PostSettingDto;
  public createdAt: Date;
  public updatedAt: Date;
  public publishedAt: Date;
  public groupIds: string[];
  public title: string;
  public summary: string;
  public itemsIds: string[];
  public coverMedia: ImageDto;

  public constructor(data: SeriesCacheDto) {
    Object.assign(this, data);
  }
}
