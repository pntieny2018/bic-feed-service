import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { groupBy } from 'lodash';

import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../../domain/repositoty-interface';
import { SearchTagsDto } from '../../../dto';

import { SearchTagsQuery } from './search-tags.query';

@QueryHandler(SearchTagsQuery)
export class SearchTagsHandler implements IQueryHandler<SearchTagsQuery, SearchTagsDto> {
  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepo: ITagRepository
  ) {}

  public async execute(query: SearchTagsQuery): Promise<SearchTagsDto> {
    const { keyword } = query.payload;

    const tagEntities = await this._tagRepo.findAll({ keyword });

    if (!tagEntities || !tagEntities.length) {
      return new SearchTagsDto([]);
    }

    const groupByTags = groupBy(tagEntities, (tag) => tag.get('name').toUpperCase());
    return new SearchTagsDto(Object.keys(groupByTags));
  }
}
