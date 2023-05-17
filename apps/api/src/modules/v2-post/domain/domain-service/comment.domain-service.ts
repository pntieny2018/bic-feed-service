import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { ICommentFactory, CreateCommentProps, COMMENT_FACTORY_TOKEN } from '../factory/interface';
import { ICommentDomainService, UpdateCommentProps } from './interface';
import { CommentEntity } from '../model/comment';
import {
  ICommentRepository,
  COMMENT_REPOSITORY_TOKEN,
} from '../repositoty-interface/comment.repository.interface';
import { COMMENT_VALIDATOR_TOKEN, ICommentValidator } from '../validator/interface';

@Injectable()
export class CommentDomainService implements ICommentDomainService {
  private readonly _logger = new Logger(CommentDomainService.name);

  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _commentFactory: ICommentFactory,
    @Inject(COMMENT_VALIDATOR_TOKEN)
    private readonly _commentValidator: ICommentValidator,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository
  ) {}

  public async create(input: CreateCommentProps): Promise<CommentEntity> {
    try {
      const commentEntityInput = this._commentFactory.createComment(input);
      const commentEntity = await this._commentRepository.createComment(commentEntityInput);
      commentEntity.commit();
      return commentEntity;
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async update(input: UpdateCommentProps): Promise<CommentEntity> {
    const { commentEntity, newData, groups, mentionUsers } = input;
    const { media } = newData;
    return commentEntity;
  }
}
