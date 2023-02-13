import { Inject } from '@nestjs/common';
import { TagFactory } from '../factory';
import { TagEntity, TagId } from '../model/tag';
import {
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface/tag.repository.interface';
import {
  ITagDomainService,
  TagCreateProps,
  TagUpdateProps,
} from './interface/tag.domain-service.interface';

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

    await this._tagRepository.create(tagEntity);

    return tagEntity;
  }

  public async updateTag(tag: TagEntity, input: TagUpdateProps): Promise<TagEntity> {
    const { name, userId } = input;
    tag.update({
      name,
      updatedBy: userId,
    });

    if (tag.isChanged()) {
      await this._tagRepository.update(tag);
    }
    return tag;
  }

  public async deleteTag(tagId: TagId): Promise<void> {
    return this._tagRepository.delete(tagId);
  }
}
