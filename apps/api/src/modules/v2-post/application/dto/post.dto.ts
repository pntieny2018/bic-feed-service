import { PostSettingDto } from './post-setting.dto';
import { LinkPreviewDto } from './link-preview.dto';
import { FileDto } from './file.dto';
import { ImageDto } from './image.dto';
import { VideoDto } from './video.dto';
import { GroupDto } from '../../../v2-group/application';
import { PostStatus } from '../../data-type/post-status.enum';
import { UserDto } from '../../../v2-user/application';
import { PostPrivacy, PostType } from '../../data-type';
import { UserMentionDto } from './user-mention.dto';
import { TagDto } from './tag.dto';

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
  public setting: PostSettingDto;
  public linkPreview?: LinkPreviewDto;
  public media: {
    files: FileDto[];
    images: ImageDto[];
    videos: VideoDto[];
  };
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
  public reactionsCount: Record<string, number>[];
  public ownerReactions: {
    id: string;
    reactionName: string;
  }[];
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: Partial<PostDto>) {
    Object.assign(this, data);
  }
}
