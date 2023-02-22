import { v4 } from 'uuid';
import { StringHelper } from '../../../../common/helpers';
import { TagEntity } from '../model/tag';
import { CreateTagOptions } from './tag.factory.interface';
export class TagFactory {
  public create(options: CreateTagOptions): TagEntity {
    const { name, groupId, userId } = options;
    const now = new Date();
    const tagEntity = new TagEntity({
      id: v4(),
      groupId: groupId,
      name: name,
      slug: StringHelper.convertToSlug(name),
      totalUsed: 0,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return tagEntity;
  }
}
