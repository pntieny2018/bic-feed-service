import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';

import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { ContentEmptyContentException } from '../exception';
import { PostEntity } from '../model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IPostGroupRepository,
  IReportRepository,
  POST_GROUP_REPOSITORY_TOKEN,
  REPORT_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import {
  IUserAdapter,
  USER_ADAPTER,
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../service-adapter-interface';

import { ContentValidator } from './content.validator';
import { IPostValidator } from './interface';

@Injectable()
export class PostValidator extends ContentValidator implements IPostValidator {
  public constructor(
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected _authorityAppService: IAuthorityAppService,

    @Inject(CONTENT_REPOSITORY_TOKEN)
    protected readonly _contentRepo: IContentRepository,
    @Inject(REPORT_REPOSITORY_TOKEN)
    protected readonly _reportRepo: IReportRepository,
    @Inject(POST_GROUP_REPOSITORY_TOKEN)
    protected readonly _postGroupRepo: IPostGroupRepository,

    @Inject(GROUP_ADAPTER)
    protected _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    protected readonly _userAdapter: IUserAdapter
  ) {
    super(
      _authorityAppService,
      _contentRepo,
      _reportRepo,
      _postGroupRepo,
      _groupAdapter,
      _userAdapter
    );
  }

  public async validatePublishContent(
    postEntity: PostEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void> {
    await super.validatePublishContent(postEntity, userAuth, groupIds);
    if (
      !postEntity.get('content') &&
      postEntity.get('media')?.files.length === 0 &&
      postEntity.get('media')?.videos.length === 0 &&
      postEntity.get('media')?.images.length === 0
    ) {
      throw new ContentEmptyContentException();
    }
  }
}
