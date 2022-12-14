import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PostTagModel } from '../../database/models/post-tag.model';
import { TagModel } from '../../database/models/tag.model';
import { ClassTransformer } from 'class-transformer';
import { PageDto } from '../../common/dto';
import { Op, Transaction } from 'sequelize';
import { GetTagDto } from './dto/requests/get-tag.dto';
import { TagResponseDto } from './dto/responses/tag-response.dto';
import { ArrayHelper, ExceptionHelper, StringHelper } from '../../common/helpers';
import { CreateTagDto } from './dto/requests/create-tag.dto';
import { UserDto } from '../auth';
import { HTTP_STATUS_ID } from '../../common/constants';
import { UpdateTagDto } from './dto/requests/update-tag.dto';
import { GroupService } from '../../shared/group';

@Injectable()
export class TagService {
  public constructor(
    @InjectModel(TagModel) private _tagModel: typeof TagModel,
    @InjectModel(PostTagModel) private _postTagModel: typeof PostTagModel,
    private readonly _groupService: GroupService
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
    const rootGroupInfos = await this._groupService.getMany(rootGroupIds);
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
    const childGroupInfos = await this._groupService.getMany(childGroupIds);
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
    const group = await this._groupService.get(createTagDto.groupId);
    if (!group) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_GROUP_NOT_EXIST);
    }
    const name = createTagDto.name.trim();
    const tag = await this._tagModel.findOne({
      where: {
        name: name,
        groupId: createTagDto.groupId,
      },
    });
    if (tag) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_TAG_NAME_EXISTING);
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
    const tag = await this._tagModel.findOne({
      where: {
        id: tagId,
      },
    });
    if (!tag) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_TAG_NOT_EXISTING);
    }

    const postTag = await this._postTagModel.findOne({
      where: {
        tagId: tagId,
      },
    });
    if (postTag) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_TAG_POST_ATTACH);
    }

    const name = updateTagDto.name.trim();
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

  public async delete(tagId: string): Promise<boolean> {
    const tag = await this._tagModel.findOne({
      where: {
        id: tagId,
      },
    });
    if (!tag) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_TAG_NOT_EXISTING);
    }
    const postTag = await this._postTagModel.findOne({ where: { tagId: tagId } });
    if (postTag) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_TAG_POST_ATTACH);
    }
    await tag.destroy();
    return true;
  }

  public async addToPost(
    tagIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (tagIds.length === 0) return;
    const dataCreate = tagIds.map((tagId) => ({
      postId,
      tagId,
    }));
    await this._postTagModel.bulkCreate(dataCreate, { transaction });
    const effectTags = await this._tagModel.findAll({ where: { id: tagIds } });
    effectTags.forEach((effectTag) =>
      effectTag.update({ totalUsed: effectTag.totalUsed + 1 }, { transaction })
    );
  }

  public async updateToPost(
    tagIds: string[],
    postId: string,
    transaction: Transaction
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
      const effectTags = await this._tagModel.findAll({ where: { id: tagIds } });
      effectTags.forEach((effectTag) =>
        effectTag.update({ totalUsed: effectTag.totalUsed - 1 }, { transaction })
      );
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
      const effectTags = await this._tagModel.findAll({ where: { id: tagIds } });
      effectTags.forEach((effectTag) =>
        effectTag.update({ totalUsed: effectTag.totalUsed + 1 }, { transaction })
      );
    }
  }

  public async getTagsByIds(ids: string[]): Promise<TagResponseDto[]> {
    const tags = await this._tagModel.findAll({ where: { id: { [Op.in]: ids } } });
    return tags.map((tag) =>
      this._classTransformer.plainToInstance(TagResponseDto, tag, {
        excludeExtraneousValues: true,
      })
    );
  }

  public async updateTotalUsedWhenDeleteArticle(ids: string[]): Promise<void> {
    const tags = await this._tagModel.findAll({ where: { id: ids } });
    for (const tag of tags) {
      await tag.update({ totalUsed: tag.totalUsed - 1 });
    }
  }
}
