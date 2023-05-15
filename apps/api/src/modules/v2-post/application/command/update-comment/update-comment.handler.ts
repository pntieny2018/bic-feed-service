import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICommentDomainService,
  COMMENT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { UpdateCommentCommand } from './update-comment.command';
import { ExternalService } from '../../../../../app/external.service';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post.repository.interface';
import { ExceptionHelper } from '../../../../../common/helpers';
import { HTTP_STATUS_ID } from '../../../../../common/constants';
import { PostAllow } from '../../../data-type/post-allow.enum';
import { COMMENT_VALIDATOR_TOKEN, ICommentValidator } from '../../../domain/validator/interface';
import { PostEntity } from '../../../domain/model/content/post.entity';
import { ClassTransformer } from 'class-transformer';
import { UserMentionDto } from '../../dto/user-mention.dto';
import { NIL } from 'uuid';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand, boolean> {
  private readonly _classTransformer = new ClassTransformer();

  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(COMMENT_VALIDATOR_TOKEN)
    private readonly _commentValidator: ICommentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    private readonly _externalService: ExternalService
  ) {}

  public async execute(command: UpdateCommentCommand): Promise<boolean> {
    const { actor, id, content, media, mentions, giphyId } = command.payload;
    return true;
    // TODO: implement logic
  }
}
