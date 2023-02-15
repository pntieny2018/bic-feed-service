import { v4 } from 'uuid';
import { StringHelper } from '../../../../common/helpers';
import { TagEntity } from '../model/tag';
import { CreateTagOptions } from './tag.factory.interface';
export class TagFactory {
  public create(options: CreateTagOptions): TagEntity {
    const { name, groupId, userId } = options;
    const now = new Date().toISOString();
    const tagEntity = TagEntity.fromJson({
      id: v4(),
      groupId: groupId.value,
      name: name.value,
      slug: StringHelper.convertToSlug(name.value),
      totalUsed: 0,
      createdBy: userId.value,
      updatedBy: userId.value,
      createdAt: now,
      updatedAt: now,
    });
    return tagEntity;
  }
}
