import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FindQuizParticipantQuery } from './find-quiz-participant.query';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { QuizParticipantDto } from '../../dto/quiz-participant.dto';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';

@QueryHandler(FindQuizParticipantQuery)
export class FindQuizParticipantHandler
  implements IQueryHandler<FindQuizParticipantQuery, QuizParticipantDto>
{
  public constructor(
    private readonly _queryBus: QueryBus,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}

  public async execute(query: FindQuizParticipantQuery): Promise<QuizParticipantDto> {
    const { authUser, quizParticipantId } = query.payload;

    const quizParticipantEntity = await this._quizDomainService.getQuizParticipant(
      quizParticipantId,
      authUser.id
    );

    const contentEntity = await this._contentDomainService.getVisibleContent(
      quizParticipantEntity.get('contentId')
    );

    const quizParticipantsDto = await this._quizBinding.bindQuizParticipants([
      quizParticipantEntity,
    ]);

    if (quizParticipantEntity.isOverTimeLimit() || quizParticipantEntity.isFinished()) {
      const quizParticipantEntities = await this._quizParticipantRepository.findAllByContentId(
        quizParticipantEntity.get('contentId'),
        authUser.id
      );
      quizParticipantsDto[0].totalTimes = quizParticipantEntities.length;
      quizParticipantsDto[0].content = {
        id: contentEntity.get('id'),
        type: contentEntity.get('type'),
      };
    }

    return quizParticipantsDto[0];
  }
}
