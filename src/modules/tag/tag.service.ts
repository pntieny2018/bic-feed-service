import { Injectable, Logger } from '@nestjs/common';
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
      order: [['name', 'ASC']],
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
    for (const rootGroupId of rootGroupIds) {
      const rootGroupInfo = await this._groupService.get(rootGroupId);
      const childGroupIds: string[] = [
        ...rootGroupInfo.child.private,
        ...rootGroupInfo.child.open,
        ...rootGroupInfo.child.closed,
        ...rootGroupInfo.child.secret,
      ];
      delete rootGroupInfo.child;
      groups[rootGroupId] = [rootGroupInfo];
      for (const childGroupId of childGroupIds) {
        const childGroupInfo = await this._groupService.get(childGroupId);
        delete childGroupInfo.child;
        groups[rootGroupId].push(childGroupInfo);
      }
    }

    for (const tag of result) {
      tag.groups = groups[tag.groupId];
      tag.used = await this._postTagModel.count({ where: { tagId: tag.id } });
    }

    return new PageDto<TagResponseDto>(result, {
      total: count,
      limit: getTagDto.limit,
      offset: getTagDto.offset,
    });
  }

  public async create(createTagDto: CreateTagDto, authUser: UserDto): Promise<TagResponseDto> {
    const name = createTagDto.name.trim();
    const tag = await this._tagModel.findOne({
      where: {
        name: name,
        groupId: createTagDto.groupId,
      },
    });
    if (tag) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_TAG_EXISTING);
    }

    const slug = StringHelper.convertToSlug(name);

    const createResult = await this._tagModel.create({
      name: name,
      groupId: createTagDto.groupId,
      slug: slug,
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

  public async getTagsByIds(ids: string[]): Promise<TagResponseDto[]> {
    const tags = await this._tagModel.findAll({ where: { id: { [Op.in]: ids } } });
    return tags.map((tag) =>
      this._classTransformer.plainToInstance(TagResponseDto, tag, {
        excludeExtraneousValues: true,
      })
    );
  }
}
