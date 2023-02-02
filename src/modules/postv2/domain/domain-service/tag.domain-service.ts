import { DomainEvents } from '@beincom/domain';
import { Inject } from '@nestjs/common';
import { MyLogger } from '../../my-log';
import { TagCreatedEvent } from '../event';
import { TagFactory } from '../factory';
import { TagEntity, TagName } from '../model/tag';
import { UserId } from '../model/user';
import {
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface/tag.repository.interface';
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
      name,
      groupId,
      createdBy: userId,
    });
    tagEntity.raiseEvent(new TagCreatedEvent(tagEntity));

    await this._tagRepository.create(tagEntity);

    DomainEvents.publishEvents(tagEntity.id, new MyLogger());

    return tagEntity;
  }

  public async updateTag(tag: TagEntity, input: TagUpdateProps): Promise<void> {
    const { name, userId } = input;
    tag.update({
      name: TagName.fromString(name),
      updatedBy: UserId.fromString(userId),
    });

    if (tag.isChanged()) {
      await this._tagRepository.create(tag);
    }
  }

  public async deleteTag(id: string): Promise<void> {
    return this._tagRepository.delete(id);
  }
}
