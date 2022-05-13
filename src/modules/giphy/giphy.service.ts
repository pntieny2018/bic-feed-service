import { GiphyModel } from '../../database/models/giphy.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GiphyDto } from './dto/requests';
import { UserMentionDto } from '../mention/dto';

@Injectable()
export class GiphyService {
  public constructor(
    @InjectModel(GiphyModel)
    private readonly _giphyModel: typeof GiphyModel
  ) {}

  public async saveGiphyData(giphyDto: GiphyDto) {
    if(giphyDto.id) {
      const giphyData = await this._giphyModel.findOne({where: {id: giphyDto.id}});
      if(!giphyData) {
        await this._giphyModel.create({id: giphyDto.id, type: giphyDto.type});
      }
    }
  }
}
