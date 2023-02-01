import { CreatedAt, EntityProps, UpdatedAt } from '@beincom/domain';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../common/helpers';
import { TagCreatedEvent } from '../event';
import { GroupId } from '../model/group';
import { TagEntity, TagId, TagName, TagProps, TagSlug, TagTotalUsed } from '../model/tag';
import { UserId } from '../model/user';

type CreateTagOptions = Readonly<{
  name: string;
  groupId: string;
  createdBy: string;
}>;

export class TagFactory {
  public create(options: CreateTagOptions): TagEntity {
    const { name, groupId, createdBy } = options;
    const now = new Date().toISOString();
    const tagEntity = TagEntity.fromJson({
      groupId: groupId,
      name: name,
      slug: StringHelper.convertToSlug(name),
      totalUsed: 0,
      createdBy: createdBy,
      updatedBy: createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return tagEntity;
  }
}
