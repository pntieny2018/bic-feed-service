import { Injectable, Logger } from '@nestjs/common';
import { HashtagResponseDto } from './dto/responses/hashtag-response.dto';
import { InjectModel } from '@nestjs/sequelize';
import { HashtagModel } from '../../database/models/hashtag.model';
import { ArrayHelper, StringHelper } from '../../common/helpers';
import { PageDto } from '../../common/dto';
import { GetHashtagDto } from './dto/requests/get-hashtag.dto';
import { Op, Transaction } from 'sequelize';
import { PostHashtagModel } from '../../database/models/post-hashtag.model';
import { ClassTransformer } from 'class-transformer';

@Injectable()
export class HashtagService {
  public constructor(
    @InjectModel(HashtagModel) private _hashtagModel: typeof HashtagModel,
    @InjectModel(PostHashtagModel) private _postHashtagModel: typeof PostHashtagModel
  ) {}
  private _logger = new Logger(HashtagService.name);
  private _classTransformer = new ClassTransformer();
  public async get(getHashtagDto: GetHashtagDto): Promise<PageDto<HashtagResponseDto>> {
    this._logger.debug('getHashtag');
    const { offset, limit } = getHashtagDto;
    const conditions = {};
    if (getHashtagDto.name) {
      conditions['name'] = { [Op.iLike]: '%' + getHashtagDto.name + '%' };
    }
    const { rows, count } = await this._hashtagModel.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [['name', 'ASC']],
    });

    const jsonSeries = rows.map((r) => r.toJSON());
    const result = this._classTransformer.plainToInstance(HashtagResponseDto, jsonSeries, {
      excludeExtraneousValues: true,
    });

    return new PageDto<HashtagResponseDto>(result, {
      total: count,
      limit: getHashtagDto.limit,
      offset: getHashtagDto.offset,
    });
  }

  public async create(hashtagName: string): Promise<HashtagResponseDto> {
    this._logger.debug('createHashtag');
    const name = hashtagName.trim();
    const slug = StringHelper.convertToSlug(hashtagName);
    const findOrCreateResult = await this._hashtagModel.findOrCreate({
      where: { name },
      defaults: {
        name,
        slug,
      },
    });

    return this._classTransformer.plainToInstance(HashtagResponseDto, findOrCreateResult[0], {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Add post to hashtags
   * @param hashtagIds
   * @param postId string
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async addToPost(
    hashtagIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (hashtagIds.length === 0) return;
    const dataCreate = hashtagIds.map((hashtagId) => ({
      postId: postId,
      hashtagId,
    }));
    await this._postHashtagModel.bulkCreate(dataCreate, { transaction });
  }

  /**
   * Delete/Insert hastags by post
   * @param hashtagIds Array of Hashtag ID
   * @param postId PostID
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updateToPost(
    hashtagIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    const currentHashtags = await this._postHashtagModel.findAll({
      where: { postId },
    });
    const currentHashtagIds = currentHashtags.map((i) => i.hashtagId);

    const deleteIds = ArrayHelper.arrDifferenceElements(currentHashtagIds, hashtagIds);
    if (deleteIds.length) {
      await this._postHashtagModel.destroy({
        where: { hashtagId: deleteIds, postId },
        transaction,
      });
    }

    const addIds = ArrayHelper.arrDifferenceElements(hashtagIds, currentHashtagIds);
    if (addIds.length) {
      await this._postHashtagModel.bulkCreate(
        addIds.map((hashtagId) => ({
          postId,
          hashtagId,
        })),
        { transaction }
      );
    }
  }

  public async findOrCreateHashtags(hashtagsName: string[]): Promise<HashtagResponseDto[]> {
    if (hashtagsName.length === 0) return [];
    const dataInsert = [];
    const hashtags = await this._hashtagModel.findAll({
      where: {
        name: hashtagsName,
      },
    });
    for (const name of hashtagsName) {
      if (!hashtags.find((h) => h.name === name)) {
        dataInsert.push({
          name,
          slug: StringHelper.convertToSlug(name),
        });
      }
    }

    const newHashtag = await this._hashtagModel.bulkCreate(dataInsert);
    return this._classTransformer.plainToInstance(
      HashtagResponseDto,
      [...hashtags, ...newHashtag],
      {
        excludeExtraneousValues: true,
      }
    );
  }
}
