import { WelcomeContentDto } from '@api/modules/v2-post/application/dto/welcome-content.dto';
import { STATIC_WELCOME_CONTENTS } from '@api/modules/v2-post/constant';
import { ArrayHelper } from '@libs/common/helpers';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';

import { GetWelcomeContentsQuery } from './get-welcome-contents.query';

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

    const contentIds = STATIC_WELCOME_CONTENTS.map((content) =>
      content.list.map((item) => item.id)
    ).flat();
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

    return STATIC_WELCOME_CONTENTS.map(
      (item) =>
        new WelcomeContentDto({
          title: item.title,
          list: item.list.map((content) => contentMap[content.id] || null),
        })
    );
  }
}
