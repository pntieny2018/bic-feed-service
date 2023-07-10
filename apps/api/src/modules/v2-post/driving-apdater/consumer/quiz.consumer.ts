import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { ProcessGenerationQuizCommand } from '../../application/command/process-generation-quiz/process-generation-quiz.command';

@Controller()
export class QuizConsumer {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.QUIZ_WAITING)
  public async postChanged(@Payload('value') payload: { quizId: string }): Promise<void> {
    const { quizId } = payload;
    await this._commandBus.execute<ProcessGenerationQuizCommand, void>(
      new ProcessGenerationQuizCommand({ quizId })
    );
  }
}
