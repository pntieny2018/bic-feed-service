import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindQuizzesQuery } from './find-quizzes.query';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { FindQuizzesDto } from '../../dto';

@QueryHandler(FindQuizzesQuery)
export class FindQuizzesHandler implements IQueryHandler<FindQuizzesQuery, FindQuizzesDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindQuizzesQuery): Promise<FindQuizzesDto> {
    const { authUser } = query.payload;

    const { rows, meta } = await this._quizDomainService.getQuizzes(query.payload);

    if (!rows || rows.length === 0) return new FindQuizzesDto([], meta);

    const contentIds = rows.map((row) => row.get('contentId'));

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids: contentIds,
      authUser,
    });

    const contents = await this._contentBinding.contentsBinding(contentEntities, authUser);

    return new FindQuizzesDto(contents, meta);
  }
}
