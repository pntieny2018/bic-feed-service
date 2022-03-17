import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MediaModel, MediaType } from '../../database/models/media.model';
import { Sequelize } from 'sequelize-typescript';
import { UserDto } from '../auth';
import { UploadType } from '../upload/dto/requests/upload.dto';

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
}
