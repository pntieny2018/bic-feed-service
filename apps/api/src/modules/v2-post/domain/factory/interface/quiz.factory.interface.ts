import { QuizEntity, QuizProps } from '../../model/quiz';

export type CreateTagProps = Readonly<{
  name: string;
  groupId: string;
  userId: string;
}>;
export interface IQuizFactory {
  create(props: CreateTagProps): QuizEntity;

  reconstitute(props: QuizProps): QuizEntity;
}
export const QUIZ_FACTORY_TOKEN = 'QUIZ_FACTORY_TOKEN';
