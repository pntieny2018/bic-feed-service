import { Inject, Injectable } from '@nestjs/common';
import { PostType } from '../../data-type';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../repositoty-interface/post.repository.interface';
import { IPostValidator } from './interface';
import { ContentValidator } from './content.validator';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';

@Injectable()
export class PostValidator extends ContentValidator implements IPostValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected _authorityAppService: IAuthorityAppService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository
  ) {
    super(_groupAppService, _authorityAppService);
  }

  public async validateSeriesAndTags(
    groupIds: string[],
    seriesIds: string[],
    tagIds: string[]
  ): Promise<void> {
    const seriesTagErrorData = {
      seriesIds: [],
      tagIds: [],
      seriesNames: [],
      tagNames: [],
    };
    if (seriesIds.length) {
      const series = await this._postRepository.findAll({
        attributes: ['id', 'title', 'groups'],
        include: {
          mustIncludeGroup: true,
        },
        where: {
          ids: seriesIds,
          type: PostType.SERIES,
          groupArchived: true,
        },
      });
      series.forEach((item) => {
        const isValid = item.get('groupIds').some((groupId) => groupIds.includes(groupId));
        if (!isValid) {
          seriesTagErrorData.seriesIds.push(item.get('id'));
          seriesTagErrorData.seriesNames.push(item.get('title'));
        }
      });
    }
  }
}
