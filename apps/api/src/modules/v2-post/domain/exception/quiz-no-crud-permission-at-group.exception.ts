import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class QuizNoCRUDPermissionAtGroupException extends DomainException {
  public constructor(errors?: any, groups?: string[], message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.QUIZ.QUIZ_NO_CRUD_PERMISSION_AT_GROUP,
      message ||
        i18n?.t(`error.quiz.no_crud_permission_at_group`, {
          args: { groups: groups.join(', ') },
        }),
      errors
    );
  }
}
