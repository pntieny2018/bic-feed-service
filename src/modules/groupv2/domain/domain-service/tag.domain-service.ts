import { DomainEvents } from '@beincom/domain';
import { Inject } from '@nestjs/common';
import { MyLogger } from '../../my-log';
import { TagCreatedEvent } from '../event';
import { TagFactory } from '../factory';
import { TagEntity, TagId } from '../model/tag';
import {
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface/group.repository.interface';
import {
  ITagDomainService,
  TagCreateProps,
  TagUpdateProps,
} from './interfaces/tag.domain-service.interface';

export class TagDomainService implements ITagDomainService {
  @Inject() private readonly _tagFactory: TagFactory;
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;

  public async createTag(input: TagCreateProps): Promise<TagEntity> {
    const { name, groupId, userId } = input;
    const tagEntity = this._tagFactory.create({
      name: name.value,
      groupId: groupId.value,
      createdBy: userId.value,
    });
    tagEntity.raiseEvent(new TagCreatedEvent(tagEntity));

    await this._tagRepository.create(tagEntity);

    DomainEvents.publishEvents(tagEntity.id, new MyLogger());

    return tagEntity;
  }

  public async updateTag(tag: TagEntity, input: TagUpdateProps): Promise<void> {
    const { name, userId } = input;
    tag.update({
      name,
      updatedBy: userId,
    });

    if (tag.isChanged()) {
      await this._tagRepository.update(tag);
    }
  }

  public async deleteTag(tagId: TagId): Promise<void> {
    return this._tagRepository.delete(tagId);
  }
}
