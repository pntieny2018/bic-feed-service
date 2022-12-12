import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PostTagModel } from '../../database/models/post-tag.model';
import { TagModel } from '../../database/models/tag.model';
import { ClassTransformer } from 'class-transformer';
import { PageDto } from '../../common/dto';
import { Op } from 'sequelize';
import { GetTagDto } from './dto/requests/get-tag.dto';
import { TagResponseDto } from './dto/responses/tag-response.dto';
import { ExceptionHelper, StringHelper } from '../../common/helpers';
import { CreateTagDto } from './dto/requests/create-tag.dto';
import { UserDto } from '../auth';
import { HTTP_STATUS_ID } from '../../common/constants';
import { UpdateTagDto } from './dto/requests/update-tag.dto';

@Injectable()
export class TagService {
  public constructor(
    @InjectModel(TagModel) private _tagModel: typeof TagModel,
    @InjectModel(PostTagModel) private _postTagModel: typeof PostTagModel
  ) {}

  private _logger = new Logger(TagService.name);
  private _classTransformer = new ClassTransformer();

  public async get(getTagDto: GetTagDto): Promise<PageDto<TagResponseDto>> {
    const { offset, limit } = getTagDto;
    const conditions = {
      groupId: getTagDto.groupId,
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

    const jsonSeries = rows.map((r) => r.toJSON());
    const result = this._classTransformer.plainToInstance(TagResponseDto, jsonSeries, {
      excludeExtraneousValues: true,
    });

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
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_TAG_POST_ATTACH);
    }

    const postTag = await this._postTagModel.findOne({
      where: {
        tagId: tagId,
      },
    });
    if (postTag) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_TAG_EXISTING);
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
}
