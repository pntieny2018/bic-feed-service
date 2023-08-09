import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { UpdateQuizAnswerCommand } from './update-quiz-answer.command';
import { QuizOverTimeException, QuizParticipantNotFoundException } from '../../../domain/exception';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QueueService } from '@app/queue';
import { QUEUES } from '@app/queue/queue.constant';

@CommandHandler(UpdateQuizAnswerCommand)
export class UpdateQuizAnswerHandler implements ICommandHandler<UpdateQuizAnswerCommand, void> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    private readonly _queueService: QueueService
  ) {}
  public async execute(command: UpdateQuizAnswerCommand): Promise<void> {
    const { quizParticipantId, authUser, answers, isFinished } = command.payload;

    const quizParticipantEntity = await this._quizParticipantRepository.findOne(quizParticipantId);

    if (!quizParticipantEntity) {
      throw new QuizParticipantNotFoundException();
    }

    if (!quizParticipantEntity.isOwner(authUser.id)) {
      throw new QuizParticipantNotFoundException();
    }

    if (quizParticipantEntity.isOverTimeLimit()) {
      throw new QuizOverTimeException();
    }

    quizParticipantEntity.updateAnswers(answers);
    if (isFinished) quizParticipantEntity.setFinishedAt();
    await this._quizParticipantRepository.update(quizParticipantEntity);

    if (isFinished) {
      this._requeueQuizParticipantResultJob(quizParticipantId);
    }
  }

  /**
   * Delete current quiz participant result job created when member start quiz
   * and create new one without delay time when member submit quiz
   * @param quizParticipantId
   */
  private async _requeueQuizParticipantResultJob(quizParticipantId: string): Promise<void> {
    const jobs = await this._queueService.getJobs(QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME, [
      'delayed',
    ]);
    const currentQuizFinishedJob = jobs.find(
      (job) => job.data.quizParticipantId === quizParticipantId
    );
    if (currentQuizFinishedJob) {
      await this._queueService.killJob(
        QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME,
        currentQuizFinishedJob.id
      );
    }

    await this._quizDomainService.createQuizParticipantResultJob(quizParticipantId);
  }
}
