import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
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
}
