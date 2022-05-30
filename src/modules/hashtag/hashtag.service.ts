import { Injectable, Logger } from '@nestjs/common';
import { HashtagResponseDto } from './dto/responses/hashtag-response.dto';
import { CreateHashtagDto } from './dto/requests/create-hashtag.dto';
import { InjectModel } from '@nestjs/sequelize';
import { HashtagModel } from '../../database/models/hashtag.model';
import { StringHelper } from '../../common/helpers';
import { UserDto } from '../auth';
import { PageDto } from '../../common/dto';
import { GetHashtagDto } from './dto/requests/get-hashtag.dto';
import { Op } from 'sequelize';

@Injectable()
export class HashtagService {
  public constructor(@InjectModel(HashtagModel) private _hashtagModel: typeof HashtagModel) {}
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

  public async createHashtag(
    user: UserDto,
    createHashtagDto: CreateHashtagDto
  ): Promise<HashtagResponseDto> {
    this._logger.debug('createHashtag');
    const name = StringHelper.convertToSlug(createHashtagDto.name);
    const findOrCreateResult = await this._hashtagModel.findOrCreate({
      where: { name: name },
      defaults: {
        name: name,
      },
    });

    return new HashtagResponseDto(findOrCreateResult[0]);
  }
}
