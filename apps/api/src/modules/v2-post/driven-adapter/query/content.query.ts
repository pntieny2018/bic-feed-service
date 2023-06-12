import { Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { IContentQuery } from '../../domain/query-interface';
import {
  ARTICLE_FACTORY_TOKEN,
  IArticleFactory,
  IPostFactory,
  ISeriesFactory,
  POST_FACTORY_TOKEN,
  SERIES_FACTORY_TOKEN,
} from '../../domain/factory/interface';
import { PostModel } from '../../../../database/models/post.model';
import { PostGroupModel } from '../../../../database/models/post-group.model';
import { PostSeriesModel } from '../../../../database/models/post-series.model';
import { PostTagModel } from '../../../../database/models/post-tag.model';
import { LinkPreviewModel } from '../../../../database/models/link-preview.model';
import { UserSeenPostModel } from '../../../../database/models/user-seen-post.model';
import { UserMarkReadPostModel } from '../../../../database/models/user-mark-read-post.model';
import { ContentRepository } from '../repository/content.repository';

export class ContentQuery implements IContentQuery {
  @Inject(POST_FACTORY_TOKEN) private readonly _postFactory: IPostFactory;
  @Inject(ARTICLE_FACTORY_TOKEN) private readonly _articleFactory: IArticleFactory;
  @Inject(SERIES_FACTORY_TOKEN) private readonly _seriesFactory: ISeriesFactory;
  private _logger = new Logger(ContentRepository.name);
  @InjectModel(PostModel)
  private readonly _postModel: typeof PostModel;
  @InjectModel(PostGroupModel)
  private readonly _postGroupModel: typeof PostGroupModel;
  @InjectModel(PostSeriesModel)
  private readonly _postSeriesModel: typeof PostSeriesModel;
  @InjectModel(PostTagModel)
  private readonly _postTagModel: typeof PostTagModel;
  @InjectModel(LinkPreviewModel)
  private readonly _linkPreviewModel: typeof LinkPreviewModel;
  @InjectModel(UserSeenPostModel)
  private readonly _userSeenPostModel: typeof UserSeenPostModel;
  @InjectModel(UserMarkReadPostModel)
  private readonly _userReadImportantPostModel: typeof UserMarkReadPostModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}
}
