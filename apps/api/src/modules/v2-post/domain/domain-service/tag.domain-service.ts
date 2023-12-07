import { SentryService } from '@libs/infra/sentry';
import { Inject, Logger } from '@nestjs/common';
import { cloneDeep } from 'lodash';

import { DatabaseException } from '../../../../common/exceptions';
import { EntityHelper } from '../../../../common/helpers';
import { TagDuplicateNameException, TagUsedException } from '../exception';
import { ArticleEntity, PostEntity } from '../model/content';
import { TagEntity } from '../model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../repositoty-interface';

import { ITagDomainService, TagCreateProps, TagUpdateProps } from './interface';

export class TagDomainService implements ITagDomainService {
  private readonly _logger = new Logger(TagDomainService.name);

  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepo: ITagRepository,

    private readonly _sentryService: SentryService
  ) {}

  public async findByIds(ids: string[]): Promise<TagEntity[]> {
    if (!ids?.length) {
      return [];
    }
    try {
      return await this._tagRepo.findAll({
        ids,
      });
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async createTag(input: TagCreateProps): Promise<TagEntity> {
    const { name, groupId, userId } = input;
    const findTagNameInGroup = await this._tagRepo.findOne({
      groupId,
      name,
    });
    if (findTagNameInGroup) {
      throw new TagDuplicateNameException();
    }

    const tagEntity = TagEntity.create(
      {
        name,
        groupId,
      },
      userId
    );
    try {
      await this._tagRepo.create(tagEntity);
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

    const findTagNameInGroup = await this._tagRepo.findOne({
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
        await this._tagRepo.update(cloneTagEntity);
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
      await this._tagRepo.delete(tagEntity.get('id'));
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async increaseTotalUsedByContent(content: PostEntity | ArticleEntity): Promise<void> {
    try {
      const tagEntities = content.getTags();
      for (const tag of tagEntities) {
        tag.increaseTotalUsed();
        await this._tagRepo.update(tag);
      }
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }

  public async decreaseTotalUsedByContent(content: PostEntity | ArticleEntity): Promise<void> {
    try {
      const tagEntities = content.getTags();
      for (const tag of tagEntities) {
        tag.decreaseTotalUsed();
        await this._tagRepo.update(tag);
      }
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }

  public async updateTagsUsedByContent(content: PostEntity | ArticleEntity): Promise<void> {
    try {
      const { attachTagIds, detachTagIds } = content.getState();

      const tagEntities = await this._tagRepo.findAll({ ids: [...attachTagIds, ...detachTagIds] });
      const tagsMap = EntityHelper.entityArrayToMap(tagEntities, 'id');

      for (const id of attachTagIds) {
        const tag = tagsMap.get(id);
        tag.increaseTotalUsed();
        await this._tagRepo.update(tag);
      }

      for (const id of detachTagIds) {
        const tag = tagsMap.get(id);
        if (tag.get('totalUsed') > 0) {
          tag.decreaseTotalUsed();
          await this._tagRepo.update(tag);
        }
      }
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }
}
