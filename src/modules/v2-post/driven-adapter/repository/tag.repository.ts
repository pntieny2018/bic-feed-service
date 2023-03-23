import { HttpStatus, Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Sequelize } from 'sequelize';
import { PostTagModel } from '../../../../database/models/post-tag.model';
import { TagModel } from '../../../../database/models/tag.model';
import { TagEntity } from '../../domain/model/tag';
import {
  FindAllTagsProps,
  FindOneTagProps,
  ITagRepository,
} from '../../domain/repositoty-interface';
import { ITagFactory, TAG_FACTORY_TOKEN } from '../../domain/factory/interface';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosHelper } from '../../../../common/helpers';
import { ENDPOINT } from '../../../../common/constants/endpoint.constant';

export class TagRepository implements ITagRepository {
  @Inject(TAG_FACTORY_TOKEN) private readonly _factory: ITagFactory;
  private _logger = new Logger(TagRepository.name);
  @InjectModel(TagModel)
  private readonly _tagModel: typeof TagModel;
  @InjectModel(PostTagModel)
  private readonly _postTagModel: typeof PostTagModel;

  public constructor(
    @InjectConnection() private readonly _sequelizeConnection: Sequelize,
    private readonly _httpService: HttpService
  ) {}

  public async create(data: TagEntity): Promise<void> {
    await this._tagModel.create({
      id: data.get('id'),
      name: data.get('name'),
      slug: data.get('slug'),
      updatedBy: data.get('updatedBy'),
      createdBy: data.get('createdBy'),
      groupId: data.get('groupId'),
      totalUsed: data.get('totalUsed'),
    });
  }

  public async update(data: TagEntity): Promise<void> {
    await this._tagModel.update(
      {
        name: data.get('name'),
        slug: data.get('slug'),
        updatedBy: data.get('updatedBy'),
        createdBy: data.get('createdBy'),
        groupId: data.get('groupId'),
        totalUsed: data.get('totalUsed'),
      },
      {
        where: { id: data.get('id') },
      }
    );
  }

  public async delete(id: string): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._postTagModel.destroy({ where: { tagId: id }, transaction });
      await this._tagModel.destroy({ where: { id: id }, transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      this._logger.error(JSON.stringify(e?.stack));
      throw e;
    }
  }

  public async findOne(input: FindOneTagProps): Promise<TagEntity> {
    const findOptions: FindOptions = { where: {} };
    if (input.id) {
      findOptions.where['id'] = input.id;
    }
    if (input.name) {
      findOptions.where['name'] = input.name;
    }
    if (input.groupId) {
      findOptions.where['groupId'] = input.groupId;
    }
    const entity = await this._tagModel.findOne(findOptions);
    return this._modelToEntity(entity);
  }

  public async findAll(input: FindAllTagsProps): Promise<TagEntity[]> {
    const { groupIds, name } = input;
    const condition: any = { groupId: groupIds.map((groupId) => groupId) };
    if (name) {
      condition.name = name.trim().toLowerCase();
    }
    const enties = await this._tagModel.findAll({
      where: condition,
    });
    const rows = enties.map((entity) => this._modelToEntity(entity));

    return rows;
  }

  public async canCUDTag(userId: string, rootGroupId: string): Promise<boolean> {
    try {
      const response = await lastValueFrom(
        this._httpService.get(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.GROUP.INTERNAL.CHECK_CUD_TAG, {
            userId,
            rootGroupId,
          })
        )
      );
      if (response.status !== HttpStatus.OK) {
        return null;
      }
      return AxiosHelper.getDataResponse<boolean>(response);
    } catch (ex) {
      this._logger.debug(ex);
      return false;
    }
  }

  private _modelToEntity(tag: TagModel): TagEntity {
    if (tag === null) return null;
    return this._factory.reconstitute(tag.toJSON());
  }
}
