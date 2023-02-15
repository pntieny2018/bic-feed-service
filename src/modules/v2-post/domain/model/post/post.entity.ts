import { AggregateRoot, EntityProps, IDomainEvent } from '@beincom/domain';
import {
  PostCommentsCount,
  PostId,
  PostImportantExpiredAt,
  PostTitle,
  PostTotalUsersSeen,
} from '.';
import { BooleanValueObject } from '../../../../../common/value-objects/boolean.value-object';
import { UserId } from '../../../../v2-user/domain/model/user';
import { PostLang } from './post-lang.value-object';
export type PostProps = {
  createdBy: UserId;
  updatedBy: UserId;
  title: PostTitle;
  content: string;
  lang: PostLang;
  commentsCount: PostCommentsCount;
  totalUsersSeen: PostTotalUsersSeen;
  isImportant: BooleanValueObject;
  importantExpiredAt?: PostImportantExpiredAt;
  canReact: BooleanValueObject;
  canShare: BooleanValueObject;
  canComment: BooleanValueObject;
  isReported: BooleanValueObject;
  isHidden: BooleanValueObject;
};

export class PostEntity extends AggregateRoot<PostId, PostProps> {
  public static TAG_NAME_MAX_LENGTH = 32;

  protected _id: PostId;

  public constructor(
    entityProps: EntityProps<PostId, PostProps>,
    domainEvent: IDomainEvent<unknown>[] = []
  ) {
    super(entityProps, domainEvent, { disablePropSetter: false });
    this._id = entityProps.id;
  }

  public validate(): void {
    //
  }

  // public static fromJson(raw: any): PostEntity {
  //   const props: EntityProps<PostId, PostProps> = {
  //     id: PostId.fromString(raw.id),
  //     props: {
  //       groupId: GroupId.fromString(raw.groupId),
  //       name: PostName.fromString(raw.name),
  //       slug: PostSlug.fromString(raw.slug),
  //       totalUsed: PostTotalUsed.fromString(raw.totalUsed),
  //       createdBy: UserId.fromString(raw.createdBy),
  //       updatedBy: UserId.fromString(raw.updatedBy),
  //     },
  //     createdAt: CreatedAt.fromDateString(raw.createdAt),
  //     updatedAt: UpdatedAt.fromDateString(raw.updatedAt),
  //   };

  //   return new PostEntity(props);
  // }
}
