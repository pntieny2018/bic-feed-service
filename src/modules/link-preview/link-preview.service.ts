import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ILinkPreview, LinkPreviewModel } from '../../database/models/link-preview.model';
import { LinkPreviewDto } from './dto/link-preview.dto';

@Injectable()
export class LinkPreviewService {
  public constructor(
    @InjectModel(LinkPreviewModel)
    private _linkPreviewModel: typeof LinkPreviewModel
  ) {}
  private _logger = new Logger(LinkPreviewService.name);

  public async upsert(linkPreviewDto: LinkPreviewDto): Promise<ILinkPreview> {
    console.log('1111111111111linkPreviewDto=', linkPreviewDto);
    try {
      if (linkPreviewDto && linkPreviewDto.url) {
        let linkPreview = await this._linkPreviewModel.findOne({
          where: { url: linkPreviewDto.url },
        });
        if (linkPreview) {
          await linkPreview.update(linkPreviewDto);
        } else {
          linkPreview = await this._linkPreviewModel.create(linkPreviewDto);
        }
        return linkPreview;
      }
      return null;
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      throw error;
    }
  }

  public async bindToPosts(posts: any[]): Promise<void> {
    const linkPreviewList = await this._linkPreviewModel.findAll({
      where: { id: { [Op.in]: posts.map((e) => e.linkPreviewId) } },
    });

    for (const post of posts) {
      post.linkPreview = linkPreviewList.find((e) => e.id === post.linkPreviewId);
    }
  }
}
