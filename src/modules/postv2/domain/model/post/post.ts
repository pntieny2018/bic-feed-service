import { AggregateRoot } from '@nestjs/cqrs';
import { PostPrivacy, PostType } from '../../../data-type';

export type PostEssentialProperties = Readonly<
  Required<{
    id: string;
    type: PostType;
    isDraft: boolean;
    createdBy: string;
    postPrivacy: PostPrivacy;
  }>
>;

export type PostOptionalProperties = Readonly<
  Partial<{
    title: string;
    content: string;
    summary: string;
    lang: string;
    commentsCount: number;
    totalUsersSeen: number;
    isImportant: boolean;
    importantExpiredAt?: Date;
    isDraft: boolean;
    canReact: boolean;
    canShare: boolean;
    canComment: boolean;
    isProcessing: boolean;
    isReported: boolean;
    isHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    comments?: any[];
    media?: any[];
    groups?: any[];
    mentions?: any[];
    mentionIds?: number[];
    reactionsCount?: string;
    giphyId: string;
    views: number;
    categories: any[];
    series?: any[];
    tagsJson?: any[];
    linkPreviewId?: string;
    cover?: string;
  }>
>;

export type PostProperties = PostEssentialProperties & Required<PostOptionalProperties>;

export class Post extends AggregateRoot {
  public id: string;
  public createdBy: string;
  public updatedBy: string;
  public content: string;
  public lang?: string;
  public commentsCount: number;
  public totalUsersSeen: number;
  public isImportant: boolean;
  public importantExpiredAt?: Date;
  public isDraft: boolean;
  public canReact: boolean;
  public canShare: boolean;
  public canComment: boolean;
  public isProcessing?: boolean;
  public isReported?: boolean;
  public isHidden?: boolean;
  public createdAt?: Date;
  public updatedAt?: Date;
  public deletedAt?: Date;
  public media?: any[];
  public groups?: any[];
  public mentions?: {
    id: string;
    name: string;
  }[];
  public mentionIds?: number[];
  public reactionsCount?: string;
  public giphyId?: string;
  public markedReadPost?: boolean;
  public type: PostType;
  public title?: string;
  public summary?: string;
  public views: number;
  public categories?: any[];
  public series?: any[];
  public hashtags?: any[];
  public tags?: any[];
  public postTags?: any[];
  public privacy?: PostPrivacy;
  public hashtagsJson?: any[];
  public tagsJson?: any[];
  public linkPreviewId?: string;
  public linkPreview?: any;
  public cover?: string;
  public articles?: Partial<any>[];
  public userSavePosts?: any[];

  public constructor(properties: PostProperties) {
    super();
    Object.assign(this, properties);
  }

  public update(): void {
    this.isDraft = false;
  }

  public publish(): void {
    this.isDraft = false;
  }
}
