import { Injectable, Logger } from '@nestjs/common';
import { HashtagResponseDto } from './dto/responses/hashtag-response.dto';
import { CreateHashtagDto } from './dto/requests/create-hashtag.dto';
import { InjectModel } from '@nestjs/sequelize';
import { HashtagModel } from '../../database/models/hashtag.model';
import { ArrayHelper, StringHelper } from '../../common/helpers';
import { UserDto } from '../auth';
import { PageDto } from '../../common/dto';
import { GetHashtagDto } from './dto/requests/get-hashtag.dto';
import { Op, Transaction } from 'sequelize';
import { PostHashtagModel } from '../../database/models/post-hashtag.model';
import { String } from 'aws-sdk/clients/appstream';

@Injectable()
export class HashtagService {
  public constructor(
    @InjectModel(HashtagModel) private _hashtagModel: typeof HashtagModel,
    @InjectModel(PostHashtagModel) private _postHashtagModel: typeof PostHashtagModel
  ) {}
  private _logger = new Logger(HashtagService.name);

  public async getHashtag(
    user: UserDto,
    getHashtagDto: GetHashtagDto
  ): Promise<PageDto<HashtagResponseDto>> {
    this._logger.debug('getHashtag');
    const conditions = {};
    if (getHashtagDto.name) {
      conditions['name'] = { [Op.like]: '%' + getHashtagDto.name + '%' };
    }
    const getResult = await this._hashtagModel.findAll({
      where: conditions,
      order: [['name', 'ASC']],
    });

    const pagingResult = getResult
      .slice(
        getHashtagDto.offset * getHashtagDto.limit,
        getHashtagDto.limit * (getHashtagDto.offset + 1)
      )
      .map((e) => new HashtagResponseDto(e));

    return new PageDto<HashtagResponseDto>(pagingResult, {
      total: getResult.length,
      limit: getHashtagDto.limit,
      offset: getHashtagDto.offset,
    });
  }

  public async createHashtag(hashtagName: string): Promise<HashtagResponseDto> {
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

    return new HashtagResponseDto(findOrCreateResult[0]);
  }

  /**
   * Add post to hashtags
   * @param hashTagIds Array of Hashtag ID
   * @param postId string
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async addPostToHashtags(
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
  public async setHashtagsByPost(
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

  public async findOrCreateHashtags(hashtags: { name: string; id?: string }[]): Promise<string[]> {
    const hashtagIds = [];
    hashtags.forEach(async (ht) => {
      let newHt = { ...ht };
      if (!ht.id) {
        newHt = await this.createHashtag(ht.name);
      }
      hashtagIds.push(newHt.id);
    });

    return hashtagIds;
  }
}
