import { Inject, Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../v2-group/application';
import { PERMISSION_KEY, SUBJECT } from '../../../../common/constants';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { IQuizValidator } from './interface/quiz.validator.interface';
import { QuizNoCRUDPermissionAtGroupException } from '../exception/quiz-no-crud-permission-at-group.exception';
import { ContentHasQuizException, ContentNotFoundException } from '../exception';

@Injectable()
export class QuizValidator implements IQuizValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected readonly _groupAppService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly _userApplicationService: IUserApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    protected readonly _contentRepository: IContentRepository,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    protected readonly _quizRepository: IQuizRepository
  ) {}

  public async checkCanCUDQuizInGroups(user: UserDto, groups: GroupDto[]): Promise<void> {
    const noPermissionInGroups: GroupDto[] = [];
    const ability = await this._authorityAppService.buildAbility(user);
    for (const group of groups) {
      if (!ability.can(PERMISSION_KEY.CUD_QUIZ, subject(SUBJECT.GROUP, { id: group.id }))) {
        noPermissionInGroups.push(group);
      }
    }

    if (noPermissionInGroups.length) {
      throw new QuizNoCRUDPermissionAtGroupException(
        {
          groupsDenied: noPermissionInGroups.map((e) => e.id),
        },
        noPermissionInGroups.map((e) => e.name)
      );
    }
  }
}
