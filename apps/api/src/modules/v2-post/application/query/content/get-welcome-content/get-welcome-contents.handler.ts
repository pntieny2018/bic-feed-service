import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';

import { GetWelcomeContentsQuery } from './get-welcome-contents.query';
import { WelcomeContentDto } from '@api/modules/v2-post/application/dto/welcome-content.dto';
import { ContentEntity } from '@api/modules/v2-post/domain/model/content';
import { ArrayHelper } from '@libs/common/helpers';

@QueryHandler(GetWelcomeContentsQuery)
export class GetWelcomeContentsHandler
  implements IQueryHandler<GetWelcomeContentsQuery, WelcomeContentDto[]>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async execute(query: GetWelcomeContentsQuery): Promise<WelcomeContentDto[]> {
    const { authUser } = query.payload;
    const staticContentList = [
      {
        title: 'Welcome to Beincom (BIC)',
        list: [
          {
            id: '0d5926e9-f018-4ea0-bf42-fbceafe8542c',
          },
          {
            id: '8ca971c3-922d-4a60-9ee9-3bba4ce47f44',
          },
        ],
      },
      {
        title: 'Beincom (BIC) Project',
        list: [
          {
            id: '472e6773-7d30-4125-bcdf-de1c8b17b168',
          },
          {
            id: 'ce5ea86d-7b7a-44be-9a32-e5d6606d62d2',
          },
          {
            id: 'a50a1d6e-6116-4591-8634-05d7895a3225',
          },
        ],
      },
    ];

    const contentIds = staticContentList
      .map((content) => content.list.map((item) => item.id))
      .flat();
    const contentEntities = await this._contentRepo.findAll({
      select: ['id', 'title', 'type'],
      where: {
        ids: contentIds,
      },
      include: {
        shouldIncludeSeen: {
          userId: authUser.id,
        },
      },
    });

    const contentMap = ArrayHelper.convertArrayToObject(
      contentEntities.map((contentEntity) => ({
        id: contentEntity.getId(),
        title: contentEntity.getTitle(),
        type: contentEntity.getType(),
        isSeen: contentEntity.getIsSeen(),
      })),
      'id'
    );

    return staticContentList.map(
      (item) =>
        new WelcomeContentDto({
          title: item.title,
          list: item.list.map((content) => contentMap[content.id] || null),
        })
    );
  }
}
