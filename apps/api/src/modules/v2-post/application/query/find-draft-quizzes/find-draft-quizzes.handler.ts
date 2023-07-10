import { Inject } from '@nestjs/common';
import { FindDraftQuizzesDto } from './find-draft-quizzes.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDraftQuizzesQuery } from './find-draft-quizzes.query';
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

@QueryHandler(FindDraftQuizzesQuery)
export class FindDraftQuizzesHandler
  implements IQueryHandler<FindDraftQuizzesQuery, FindDraftQuizzesDto>
{
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindDraftQuizzesQuery): Promise<FindDraftQuizzesDto> {
    const { authUser } = query.payload;

    const { rows, meta } = await this._quizDomainService.getDrafts(query.payload);

    if (!rows || rows.length === 0) return new FindDraftQuizzesDto([], meta);

    const contentIds = rows.map((row) => row.get('contentId'));

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids: contentIds,
      authUser,
    });

    const contents = await this._contentBinding.contentsBinding(contentEntities, authUser);

    return new FindDraftQuizzesDto(contents, meta);
  }
}
