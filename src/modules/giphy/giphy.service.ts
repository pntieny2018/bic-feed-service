import { GiphyModel } from '../../database/models/giphy.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GiphyDto } from './dto/requests';
import { createUrlFromId } from './giphy.util';

@Injectable()
export class GiphyService {
  public constructor(
    @InjectModel(GiphyModel)
    private readonly _giphyModel: typeof GiphyModel
  ) {}

  public async saveGiphyData(giphyDto: GiphyDto): Promise<void> {
    if (giphyDto && giphyDto.id) {
      const giphyData = await this._giphyModel.findOne({ where: { id: giphyDto.id } });
      if (!giphyData) {
        await this._giphyModel.create({ id: giphyDto.id, type: giphyDto.type });
      }
    }
  }

  public async bindUrlToComment(comments: any[]): Promise<void> {
    // Currently giphy only have gif type so just add link to it
    return comments.forEach((e) => {
      if (e.giphyId) {
        e.giphyUrl = createUrlFromId(e.giphyId);
      }
    });
  }
}
