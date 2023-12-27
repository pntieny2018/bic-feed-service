import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';

import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { ContentEmptyContentException } from '../exception';
import { PostEntity } from '../model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
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
    @Inject(GROUP_ADAPTER)
    protected _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    protected readonly _userAdapter: IUserAdapter,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected _authorityAppService: IAuthorityAppService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    protected readonly _contentRepository: IContentRepository
  ) {
    super(_groupAdapter, _userAdapter, _authorityAppService, _contentRepository);
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
