import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { ICommentFactory, POST_FACTORY_TOKEN, CreateCommentProps } from '../factory/interface';
import { ICommentDomainService } from './interface';
import { CommentEntity } from '../model/comment';
import {
  ICommentRepository,
  COMMENT_REPOSITORY_TOKEN,
} from '../repositoty-interface/comment.repository.interface';

export class CommentDomainService implements ICommentDomainService {
  private readonly _logger = new Logger(CommentDomainService.name);

  @Inject(POST_FACTORY_TOKEN)
  private readonly _commentFactory: ICommentFactory;
  @Inject(COMMENT_REPOSITORY_TOKEN)
  private readonly _commentRepository: ICommentRepository;

  public async create(input: CreateCommentProps): Promise<CommentEntity> {
    const commentEntity = this._commentFactory.createComment(input);
    try {
      await this._commentRepository.createComment(commentEntity);
      commentEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return commentEntity;
  }
}
