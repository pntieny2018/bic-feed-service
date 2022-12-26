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
    comments?: IComment[];
    media?: IMedia[];
    groups?: IPostGroup[];
    mentions?: IMention[];
    mentionIds?: number[];
    reactionsCount?: string;
    giphyId: string;
    views: number;
    categories: ICategory[];
    series?: IPost[];
    hashtagsJson?: HashtagResponseDto[];
    tagsJson?: TagResponseDto[];
    linkPreviewId?: string;
    linkPreview?: ILinkPreview;
    cover?: string;
    articles?: Partial<IPost>[];
  }>
>;

export type PostProperties = PostEssentialProperties & Required<PostOptionalProperties>;

export interface IPost {
  update: () => void;
  publish: () => void;
  commit: () => void;
}
export class PostImplement extends AggregateRoot implements IPost {
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
  public media?: IMedia[];
  public groups?: IPostGroup[];
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
  public categories?: ICategory[];
  public series?: IPost[];
  public hashtags?: IHashtag[];
  public tags?: ITag[];
  public postTags?: IPostTag[];
  public privacy?: PostPrivacy;
  public hashtagsJson?: HashtagResponseDto[];
  public tagsJson?: TagResponseDto[];
  public linkPreviewId?: string;
  public linkPreview?: ILinkPreview;
  public cover?: string;
  public articles?: Partial<IPost>[];
  public userSavePosts?: IUserSavePost[];

  public constructor(properties: AccountProperties) {
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
