import { DomainException } from '@beincom/domain';

import { ERRORS } from '../../../../common/constants/errors';

export class PostInvalidParameterException extends DomainException {
  public static code = ERRORS.POST_INVALID_PARAMETER;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Invalid series, tags';
    super(PostInvalidParameterException.code, message, error);
  }
}

export class PostStatusConflictedException extends DomainException {
  public static code = ERRORS.POST_STATUS_CONFLICTED;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Post status is conflicted';
    super(PostStatusConflictedException.code, message, error);
  }
}

export class PostVideoProcessingException extends DomainException {
  public static code = ERRORS.POST_VIDEO_PROCESSING;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Post video is processing';
    super(PostStatusConflictedException.code, message, error);
  }
}
