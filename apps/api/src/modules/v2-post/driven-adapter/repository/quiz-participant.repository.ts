import { InjectModel } from '@nestjs/sequelize';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { IQuizParticipantRepository } from '../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizParticipantAnswerModel } from '../../../../database/models/quiz-participant-answers.model';
import {
  IQuizParticipant,
  QuizParticipantModel,
} from '../../../../database/models/quiz-participant.model';

export class QuizParticipantRepository implements IQuizParticipantRepository {
  public constructor(
    @InjectModel(QuizParticipantAnswerModel)
    private readonly _quizParticipantAnswerModel: typeof QuizParticipantAnswerModel,

    @InjectModel(QuizParticipantModel)
    private readonly _quizParticipantModel: typeof QuizParticipantModel
  ) {}

  public async create(quizParticipant: QuizParticipantEntity): Promise<void> {
    await this._quizParticipantModel.create({
      id: quizParticipant.get('id'),
      quizId: quizParticipant.get('quizId'),
      postId: quizParticipant.get('contentId'),
      quizSnapshot: {
        title: quizParticipant.get('quizSnapshot').title,
        description: quizParticipant.get('quizSnapshot').description,
        questions: quizParticipant.get('quizSnapshot').questions.map((question) => ({
          id: question.id,
          content: question.content,
          answers: question.answers.map((answer) => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
          })),
        })),
      },
      score: quizParticipant.get('score'),
      timeLimit: quizParticipant.get('timeLimit'),
      totalQuestionsCompleted: quizParticipant.get('totalQuestionsCompleted'),
      startedAt: quizParticipant.get('startedAt'),
      finishedAt: quizParticipant.get('finishedAt'),
      createdBy: quizParticipant.get('createdBy'),
      updatedBy: quizParticipant.get('updatedBy'),
      createdAt: quizParticipant.get('createdAt'),
      updatedAt: quizParticipant.get('updatedAt'),
    });
  }

  public async findOne(takeId: string): Promise<QuizParticipantEntity> {
    const takeQuizModel = await this._quizParticipantModel.findOne({
      include: [
        {
          model: this._quizParticipantAnswerModel,
          required: false,
        },
      ],
      where: {
        id: takeId,
      },
    });

    return this._modelToEntity(takeQuizModel);
  }

  public async findAllByContentId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantEntity[]> {
    const rows = await this._quizParticipantModel.findAll({
      include: [
        {
          model: this._quizParticipantAnswerModel,
          required: false,
        },
      ],
      where: {
        postId: contentId,
        createdBy: userId,
      },
    });

    return rows.map((row) => this._modelToEntity(row));
  }

  public async g(takeId: string): Promise<QuizParticipantEntity> {
    const takeQuizModel = await this._quizParticipantModel.findOne({
      include: [
        {
          model: this._quizParticipantAnswerModel,
          required: false,
        },
      ],
      where: {
        id: takeId,
      },
    });

    return this._modelToEntity(takeQuizModel);
  }

  private _modelToEntity(takeQuizModel: IQuizParticipant): QuizParticipantEntity {
    return new QuizParticipantEntity({
      id: takeQuizModel.id,
      contentId: takeQuizModel.postId,
      quizId: takeQuizModel.quizId,
      quizSnapshot: takeQuizModel.quizSnapshot,
      score: takeQuizModel.score,
      timeLimit: takeQuizModel.timeLimit,
      totalQuestionsCompleted: takeQuizModel.totalQuestionsCompleted,
      startedAt: takeQuizModel.startedAt,
      finishedAt: takeQuizModel.finishedAt,
      createdBy: takeQuizModel.createdBy,
      updatedBy: takeQuizModel.updatedBy,
      createdAt: takeQuizModel.createdAt,
      updatedAt: takeQuizModel.updatedAt,
      answers: takeQuizModel.answers,
    });
  }
}
