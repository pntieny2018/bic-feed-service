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

  public async bindGiphyToComment(commentsResponse: any[]): Promise<void> {
    for (const comment of commentsResponse) {
      if(comment.giphyId) {
        const giphyType = await this._giphyModel.findByPk(comment.giphyId)
        comment.giphyInfo = {
          id: comment.giphyId,
          url: `https://media4.giphy.com/media/${comment.giphyId}/giphy.gif`,
          type: giphyType.type
        }
      }
    }

  }
}
