import { UserDto } from '../auth';
import { FindOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { HttpException, HttpStatus } from '@nestjs/common';
import { IMedia } from '../../database/models/media.model';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MediaModel, MediaType } from '../../database/models/media.model';

@Injectable()
export class MediaService {
  private _logger = new Logger(MediaService.name);
  public constructor(
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel
  ) {}

  /**
   * Create media
   * @param user UserDto
   * @param url String
   * @param mediaType MediaType
   */
  public async create(user: UserDto, url: string, mediaType: MediaType): Promise<any> {
    try {
      return await this._mediaModel.create({
        createdBy: user.userId,
        url: url,
        type: mediaType,
      });
    } catch (ex) {
      throw new InternalServerErrorException("Can't create media");
    }
  }

  /**
   *  Delete media
   * @param user UserDto
   * @param mediaId Number
   */
  public async destroy(user: UserDto, mediaId: number): Promise<any> {
    return await this._mediaModel.destroy({
      where: {
        createdBy: user.userId,
        id: mediaId,
      },
    });
  }

  /**
   *  Get media list
   * @param options FindOptions
   */
  public async getMediaList(options?: FindOptions<IMedia>): Promise<MediaModel[]> {
    const result = await this._mediaModel.findAll(options);

    return result;
  }

  /**
   * Validate Mention
   * @param mediaIds Array of media ID
   * @param createdBy created_by of post
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async checkValidMedia(mediaIds: number[], createdBy: number): Promise<boolean> {
    if (mediaIds.length === 0) return true;

    const getMediaList = await this._mediaModel.findAll({
      where: {
        id: mediaIds,
        createdBy,
      },
    });

    if (getMediaList.length < mediaIds.length) {
      throw new HttpException('Media ID is invalid', HttpStatus.BAD_REQUEST);
    }

    return true;
  }

  /**
   * Validate Mention
   * @param mediaIds Array of Media ID
   * @param createdBy created_by of post
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async activeMedia(mediaIds: number[], createdBy: number): Promise<boolean> {
    if (mediaIds.length === 0) return true;

    await this._mediaModel.update(
      {
        isDraft: false,
      },
      {
        where: { id: mediaIds, createdBy },
      }
    );

    return true;
  }
}
