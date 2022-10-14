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
    private _postLinkPreviewModel: typeof PostLinkPreviewModel
  ) {}
  private _logger = new Logger(LinkPreviewService.name);

  public async upsert(linkPreviewDto: LinkPreviewDto, postId: string): Promise<void> {
    try {
      if (linkPreviewDto && linkPreviewDto.url) {
        let linkPreview: LinkPreviewModel = await this._linkPreviewModel.findOne({
          where: { url: linkPreviewDto.url },
        });
        if (linkPreview) {
          await linkPreview.update(linkPreviewDto);
        } else {
          linkPreview = await this._linkPreviewModel.create(linkPreviewDto);
        }
        const postLinkPreview = await this._postLinkPreviewModel.findOne({ where: { postId } });
        if (postLinkPreview) {
          if (postLinkPreview.linkPreviewId !== linkPreview.id) {
            await this._postLinkPreviewModel.update(
              { linkPreviewId: linkPreview.id },
              { where: { postId: postLinkPreview.postId } }
            );
          }
        } else {
          await this._postLinkPreviewModel.create({
            postId: postId,
            linkPreviewId: linkPreview.id,
          });
        }
      } else {
        const postLinkPreview = await this._postLinkPreviewModel.findOne({
          where: { postId: postId },
        });
        if (postLinkPreview) {
          await this._postLinkPreviewModel.destroy({ where: { postId: postId } });
          const remainPostLink = await this._postLinkPreviewModel.findOne({
            where: { linkPreviewId: postLinkPreview.linkPreviewId },
          });
          if (!remainPostLink) {
            await this._linkPreviewModel.destroy({ where: { id: postLinkPreview.linkPreviewId } });
          }
        }
      }
    } catch (error) {
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
        post.linkPreview = {};
        post.linkPreview.url = linkPreview.linkPreview.url;
        post.linkPreview.domain = linkPreview.linkPreview.domain;
        post.linkPreview.image = linkPreview.linkPreview.image;
        post.linkPreview.title = linkPreview.linkPreview.title;
        post.linkPreview.description = linkPreview.linkPreview.description;
      }
    }
  }
}
