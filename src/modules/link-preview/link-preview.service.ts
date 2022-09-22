import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { LinkPreviewModel } from '../../database/models/link-preview.model';
import { PostLinkPreviewModel } from '../../database/models/post-link-preview.model';
import { LinkPreviewDto } from './dto/link-preview.dto';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

@Injectable()
export class LinkPreviewService {
  public constructor(
    @InjectModel(LinkPreviewModel)
    private _linkPreviewModel: typeof LinkPreviewModel,
    @InjectModel(PostLinkPreviewModel)
    private _postLinkPreviewModel: typeof PostLinkPreviewModel,
    @InjectConnection()
    protected sequelizeConnection: Sequelize
  ) {}
  private _logger = new Logger(LinkPreviewService.name);

  public async upsert(linkPreviewDto: LinkPreviewDto, postId: string): Promise<void> {
    let transaction;
    try {
      transaction = await this.sequelizeConnection.transaction();

      if (linkPreviewDto) {
        let linkPreview: LinkPreviewModel = await this._linkPreviewModel.findOne({
          where: { url: linkPreviewDto.url },
        });
        if (linkPreview) {
          await linkPreview.update(linkPreviewDto, { transaction }); // waiting for requirement
        } else {
          linkPreview = await this._linkPreviewModel.create(linkPreviewDto, {
            transaction,
          });
        }
        const postLinkPreview = await this._postLinkPreviewModel.findOne({ where: { postId } });
        if (postLinkPreview) {
          await this._postLinkPreviewModel.create(
            {
              postId: postId,
              linkPreviewId: linkPreview.id,
            },
            { transaction }
          );
        } else {
          if (postLinkPreview.linkPreviewId !== linkPreview.id) {
            await postLinkPreview.update({ linkPreviewId: linkPreview.id }, { transaction });
          }
        }
      }
      await transaction.commit();
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      throw error;
    }
  }

  public async bindToPosts(posts: any[]): Promise<void> {
    const linkPreviewList = await this._postLinkPreviewModel.findAll({
      where: { postId: { [Op.in]: posts.map((e) => e.id) } },
      include: {
        model: LinkPreviewModel,
        required: true,
      },
    });

    for (const post of posts) {
      const linkPreview = linkPreviewList.find((e) => e.postId === post.id);
      if (linkPreview) {
        post.linkPreview = linkPreview.linkPreview.get();
      }
    }
  }
}
