import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions';
import { TagDuplicateNameException, TagUsedException } from '../exception';
import { ITagFactory, TAG_FACTORY_TOKEN } from '../factory/interface';
import { TagEntity } from '../model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../repositoty-interface';
import { ITagDomainService, TagCreateProps, TagUpdateProps } from './interface';
import { cloneDeep } from 'lodash';

export class TagDomainService implements ITagDomainService {
  private readonly _logger = new Logger(TagDomainService.name);

  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_FACTORY_TOKEN)
  private readonly _tagFactory: ITagFactory;

  public async createTag(input: TagCreateProps): Promise<TagEntity> {
    const { name, groupId, userId } = input;
    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId,
      name,
    });
    if (findTagNameInGroup) {
      throw new TagDuplicateNameException();
    }

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
    const cloneTagEntity = cloneDeep(tag);
    const { name, userId } = input;

    if (cloneTagEntity.get('totalUsed') > 0) {
      throw new TagUsedException();
    }

    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId: cloneTagEntity.get('groupId'),
      name,
    });

    if (findTagNameInGroup && findTagNameInGroup.get('id') !== cloneTagEntity.get('id')) {
      throw new TagDuplicateNameException();
    }

    cloneTagEntity.update({
      name,
      updatedBy: userId,
    });

    if (cloneTagEntity.isChanged()) {
      try {
        await this._tagRepository.update(cloneTagEntity);
        cloneTagEntity.commit();
      } catch (e) {
        this._logger.error(JSON.stringify(e?.stack));
        throw new DatabaseException();
      }
    }
    return cloneTagEntity;
  }

  public async deleteTag(tagEntity: TagEntity): Promise<void> {
    if (tagEntity.get('totalUsed') > 0) {
      throw new TagUsedException();
    }
    try {
      await this._tagRepository.delete(tagEntity.get('id'));
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
