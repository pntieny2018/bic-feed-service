import { Inject } from '@nestjs/common';
import { QuizStatus } from '../../../data-type';
import { ArticleDto, PostDto, QuizDto, SeriesDto } from '../../dto';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FindPostsByIdsQuery } from '../find-posts-by-ids/find-posts-by-ids.query';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { FindQuizQuery } from './find-quiz.query';
import { QuizNotFoundException } from '../../../domain/exception';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface/content.domain-service.interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { IQuizValidator, QUIZ_VALIDATOR_TOKEN } from '../../../domain/validator/interface';

@QueryHandler(FindQuizQuery)
export class FindQuizHandler implements IQueryHandler<FindQuizQuery, QuizDto> {
  public constructor(
    private readonly _queryBus: QueryBus,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(QUIZ_VALIDATOR_TOKEN)
    private readonly _quizValidator: IQuizValidator,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}

  public async execute(query: FindQuizQuery): Promise<QuizDto> {
    const { authUser, quizId } = query.payload;

    const quizEntity = await this._quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quizEntity) {
      throw new QuizNotFoundException();
    }

    const contentEntity = await this._contentDomainService.getVisibleContent(
      quizEntity.get('contentId')
    );
    const groups = await this._groupAppService.findAllByIds(contentEntity.getGroupIds());
    await this._quizValidator.checkCanCUDQuizInGroups(authUser, groups);

    return this._quizBinding.binding(quizEntity);
  }
}
