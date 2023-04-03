import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { ITagFactory, TAG_FACTORY_TOKEN } from '../factory';
import { TagEntity } from '../model/tag';
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
  private readonly _logger = new Logger(TagDomainService.name);

  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_FACTORY_TOKEN)
  private readonly _tagFactory: ITagFactory;

  public async createTag(input: TagCreateProps): Promise<TagEntity> {
    const { name, groupId, userId } = input;
    const tagEntity = this._tagFactory.create({
      name,
      groupId,
      userId,
    });
    try {
      await this._tagRepository.create(tagEntity);
      tagEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return tagEntity;
  }

  public async updateTag(tag: TagEntity, input: TagUpdateProps): Promise<TagEntity> {
    const { name, userId } = input;
    tag.update({
      name,
      updatedBy: userId,
    });
    console.log('11111111');
    if (tag.isChanged()) {
      console.log('changeddddddddd');
      try {
        await this._tagRepository.update(tag);
        tag.commit();
      } catch (e) {
        this._logger.error(JSON.stringify(e?.stack));
        throw new DatabaseException();
      }
    }
    return tag;
  }

  public async deleteTag(tagId: string): Promise<void> {
    try {
      await this._tagRepository.delete(tagId);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
