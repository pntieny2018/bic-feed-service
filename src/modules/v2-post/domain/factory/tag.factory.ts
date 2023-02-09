import { v4 } from 'uuid';
import { StringHelper } from '../../../../common/helpers';
import { TagEntity } from '../model/tag';

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
      id: v4(),
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
