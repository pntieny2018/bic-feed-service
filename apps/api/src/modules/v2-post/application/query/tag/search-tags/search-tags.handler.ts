import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { groupBy } from 'lodash';

import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { GroupTagsDto, SearchTagsDto } from '../../../dto';

import { SearchTagsQuery } from './search-tags.query';

@QueryHandler(SearchTagsQuery)
export class SearchTagsHandler implements IQueryHandler<SearchTagsQuery, SearchTagsDto> {
  public constructor(
    @Inject(TAG_DOMAIN_SERVICE_TOKEN)
    private readonly _tagDomainService: ITagDomainService
  ) {}

  public async execute(query: SearchTagsQuery): Promise<SearchTagsDto> {
    const { keyword } = query.payload;

    const tagEntities = await this._tagDomainService.findTagsByKeyword(keyword);

    if (!tagEntities || !tagEntities.length) {
      return new SearchTagsDto([]);
    }

    const groupByTags = groupBy(tagEntities, (tag) => tag.get('name').toUpperCase());
    const groupTagsDto: GroupTagsDto[] = [];
    Object.keys(groupByTags).forEach((key) => {
      groupTagsDto.push(
        new GroupTagsDto({
          name: key,
          ids: groupByTags[key].map((item) => item.get('id')),
        })
      );
    });

    return new SearchTagsDto(groupTagsDto);
  }
}
