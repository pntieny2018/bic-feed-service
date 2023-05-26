import { PostPrivacy, PostStatus, PostType } from '../../../../database/models/post.model';
import { UserDto } from '../../../v2-user/application';
import { GroupDto } from '../../../v2-group/application';
import { ImageDto, PostDto, PostSettingDto } from '.';

export class SeriesDto {
  public id: string;

  public title: string;

  public summary: string;

  public audience: {
    groups: GroupDto[];
  };

  public communities?: GroupDto[];

  public items?: PostDto[] = [];

  public setting: PostSettingDto;

  public isHidden?: boolean;

  public coverMedia?: ImageDto;

  public actor: UserDto;

  public status: PostStatus;

  public privacy: PostPrivacy;

  public type: PostType;

  public markedReadPost?: boolean;

  public isSaved?: boolean;

  public commentsCount: number;

  public totalUsersSeen: number;

  public reactionsCount?: Record<string, Record<string, number>>;

  public ownerReactions?: {
    id: string;
    reactionName: string;
  }[] = [];

  public createdAt: Date;

  public updatedAt?: Date;

  public createdBy: string;

  public constructor(data: Partial<SeriesDto>) {
    Object.assign(this, data);
  }
}
