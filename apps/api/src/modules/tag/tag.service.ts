import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PostTagModel } from '../../database/models/post-tag.model';
import { ITag, TagModel } from '../../database/models/tag.model';
import { ClassTransformer } from 'class-transformer';
import { PageDto } from '../../common/dto';
import { Op, Transaction } from 'sequelize';
import { GetTagDto } from './dto/requests/get-tag.dto';
import { TagResponseDto } from './dto/responses/tag-response.dto';
import { ArrayHelper, StringHelper } from '../../common/helpers';
import { CreateTagDto } from './dto/requests/create-tag.dto';
import { UpdateTagDto } from './dto/requests/update-tag.dto';
import { PostModel } from '../../database/models/post.model';
import { ExternalService } from '../../app/external.service';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../v2-group/application';
import { UserDto } from '../v2-user/application';
import { GroupNotFoundException } from '../v2-post/domain/exception/external.exception';
import {
  TagDuplicateNameException,
  TagNoCreatePermissionException,
  TagNoDeletePermissionException,
  TagNotFoundException,
  TagUsedException,
} from '../v2-post/domain/exception';

@Injectable()
export class TagService {
  public constructor(
    @InjectModel(TagModel) private _tagModel: typeof TagModel,
    @InjectModel(PostTagModel) private _postTagModel: typeof PostTagModel,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    private readonly _externalService: ExternalService
  ) {}

  private _logger = new Logger(TagService.name);
  private _classTransformer = new ClassTransformer();

  public async get(getTagDto: GetTagDto): Promise<PageDto<TagResponseDto>> {
    const { offset, limit } = getTagDto;
    const conditions = {
      groupId: getTagDto.groupIds,
    };
    if (getTagDto.name) {
      conditions['name'] = { [Op.iLike]: '%' + getTagDto.name + '%' };
    }
    const { rows, count } = await this._tagModel.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [
        ['totalUsed', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    const rootGroupIds = [];
    const jsonSeries = rows.map((r) => {
      rootGroupIds.push(r.groupId);
      return r.toJSON();
    });

    const result = this._classTransformer.plainToInstance(TagResponseDto, jsonSeries, {
      excludeExtraneousValues: true,
    });

    const groups = {};
    const groupIdMap = {};
    const rootGroupInfos = await this._groupAppService.findAllByIds(rootGroupIds);
    const childGroupIds = rootGroupInfos.reduce<string[]>((ids, rootGroupInfo) => {
      const childIds = [
        ...rootGroupInfo.child.private,
        ...rootGroupInfo.child.open,
        ...rootGroupInfo.child.closed,
        ...rootGroupInfo.child.secret,
      ];
      groupIdMap[rootGroupInfo.id] = childIds;
      return ids.concat(childIds);
    }, []);
    const childGroupInfos = await this._groupAppService.findAllByIds(childGroupIds);
    for (const rootGroupInfo of rootGroupInfos) {
      delete rootGroupInfo.child;
      groups[rootGroupInfo.id] = [rootGroupInfo];
      for (const childGroupId of groupIdMap[rootGroupInfo.id]) {
        const thisChildGroupInfo = childGroupInfos.find((e) => e.id === childGroupId);
        delete thisChildGroupInfo.child;
        groups[rootGroupInfo.id].push(thisChildGroupInfo);
      }
    }

    for (const tag of result) {
      tag.groups = groups[tag.groupId];
    }

    return new PageDto<TagResponseDto>(result, {
      total: count,
      limit: getTagDto.limit,
      offset: getTagDto.offset,
    });
  }

  public async create(createTagDto: CreateTagDto, authUser: UserDto): Promise<TagResponseDto> {
    const canCreateTag = await this._externalService.canCudTag(authUser.id, createTagDto.groupId);
    if (!canCreateTag) {
      throw new TagNoCreatePermissionException();
    }
    const group = await this._groupAppService.findOne(createTagDto.groupId);
    if (!group) {
      throw new GroupNotFoundException();
    }
    const name = createTagDto.name;
    const tag = await this._tagModel.findOne({
      where: {
        name: name,
        groupId: createTagDto.groupId,
      },
    });
    if (tag) {
      throw new TagDuplicateNameException();
    }

    const slug = StringHelper.convertToSlug(name);

    const createResult = await this._tagModel.create({
      name: name,
      groupId: createTagDto.groupId,
      slug: slug,
      totalUsed: 0,
      createdBy: authUser.id,
      updatedBy: authUser.id,
    });

    return this._classTransformer.plainToInstance(TagResponseDto, createResult, {
      excludeExtraneousValues: true,
    });
  }

  public async update(
    tagId: string,
    updateTagDto: UpdateTagDto,
    authUser: UserDto
  ): Promise<TagResponseDto> {
    const name = updateTagDto.name;
    const tags = await this._tagModel.findAll({
      where: {
        [Op.or]: [{ id: tagId }, { name: name }],
      },
    });
    const tag = tags.find((e) => e.id === tagId);
    if (!tag) {
      throw new TagNotFoundException();
    }

    const canUpdateTag = await this._externalService.canCudTag(authUser.id, tag.groupId);
    if (!canUpdateTag) {
      throw new TagDuplicateNameException();
    }

    if (tags.find((e) => e.name === name && e.groupId === tag.groupId && e.id !== tag.id)) {
      throw new TagDuplicateNameException();
    }

    if (tag.totalUsed) {
      throw new TagUsedException();
    }

    const slug = StringHelper.convertToSlug(name);

    await tag.update({
      name: name,
      slug: slug,
      updatedBy: authUser.id,
    });

    return this._classTransformer.plainToInstance(TagResponseDto, tag, {
      excludeExtraneousValues: true,
    });
  }

  public async delete(tagId: string, authUser: UserDto): Promise<boolean> {
    const tag = await this._tagModel.findOne({
      where: {
        id: tagId,
      },
    });
    if (!tag) {
      throw new TagNotFoundException();
    }

    const canDeleteTag = await this._externalService.canCudTag(authUser.id, tag.groupId);
    if (!canDeleteTag) {
      throw new TagNoDeletePermissionException();
    }
    if (tag.totalUsed) {
      throw new TagUsedException();
    }
    const postTags = await this._postTagModel.findAll({ where: { tagId: tagId } });
    await this._postModel.update(
      { tagsJson: null },
      { where: { id: postTags.map((e) => e.postId) } }
    );
    await this._postTagModel.destroy({ where: { tagId: tagId } });
    await tag.destroy();
    return true;
  }

  public async addToPost(
    tagIds: string[],
    postId: string,
    transaction?: Transaction
  ): Promise<void> {
    if (tagIds.length === 0) return;
    const dataCreate = tagIds.map((tagId) => ({
      postId,
      tagId,
    }));
    await this._postTagModel.bulkCreate(dataCreate, { transaction });
  }

  public async updateToPost(
    tagIds: string[],
    postId: string,
    transaction?: Transaction
  ): Promise<void> {
    const currentTags = await this._postTagModel.findAll({
      where: { postId },
    });
    const currentTagIds = currentTags.map((i) => i.tagId);

    const deleteIds = ArrayHelper.arrDifferenceElements(currentTagIds, tagIds);
    if (deleteIds.length) {
      await this._postTagModel.destroy({
        where: { tagId: deleteIds, postId },
        transaction,
      });
    }

    const addIds = ArrayHelper.arrDifferenceElements(tagIds, currentTagIds);
    if (addIds.length) {
      await this._postTagModel.bulkCreate(
        addIds.map((tagId) => ({
          postId,
          tagId,
        })),
        { transaction }
      );
    }
  }

  public async getTagsByIds(ids: string[]): Promise<ITag[]> {
    const tags = await this._tagModel.findAll({ where: { id: { [Op.in]: ids } } });
    return tags;
  }

  public async increaseTotalUsed(ids: string[], transaction?: Transaction): Promise<void> {
    const tags = await this._tagModel.findAll({ where: { id: ids } });
    for (const tag of tags) {
      if (transaction) {
        await tag.update({ totalUsed: tag.totalUsed + 1 }, { transaction });
      } else {
        await tag.update({ totalUsed: tag.totalUsed + 1 });
      }
    }
  }

  public async decreaseTotalUsed(ids: string[], transaction?: Transaction): Promise<void> {
    const tags = await this._tagModel.findAll({ where: { id: ids } });
    for (const tag of tags) {
      if (transaction) {
        await tag.update({ totalUsed: tag.totalUsed - 1 }, { transaction });
      } else {
        await tag.update({ totalUsed: tag.totalUsed - 1 });
      }
    }
  }

  public async getInvalidTagsByAudience(
    tagIds: string[],
    audienceGroupIds: string[]
  ): Promise<ITag[]> {
    const tagsInfos = await this._tagModel.findAll({ where: { id: tagIds } });
    const audienceGroupInfos = await this._groupAppService.findAllByIds(audienceGroupIds);
    const audienceRootGroupIds = audienceGroupInfos.map((e) => e.rootGroupId);
    const invalidTags = tagsInfos.filter(
      (tagInfo) => !audienceRootGroupIds.includes(tagInfo.groupId)
    );
    if (invalidTags.length) {
      return invalidTags;
    }
    return [];
  }

  public async findTag(name: string, groupId: string): Promise<string> {
    const tag = await this._tagModel.findOne({
      where: {
        name: name,
        groupId: groupId,
      },
    });
    if (!tag) {
      return null;
    }
    return tag.id;
  }
}
