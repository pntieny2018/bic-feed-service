import { CONTENT_TYPE } from '@beincom/constants';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';

import { ELASTIC_POST_MAPPING_PATH } from '../../common/constants/elasticsearch.constant';
import { StringHelper } from '../../common/helpers';
import { BodyES } from '../../common/interfaces/body-ealsticsearch.interface';
import { RULES } from '../v2-post/constant';

import { IPostSearchQuery } from './interfaces';

@Injectable()
export class ElasticsearchQueryBuilder {
  public buildPayloadSearchForContent(query: IPostSearchQuery): BodyES {
    const {
      startTime,
      endTime,
      keyword,
      contentTypes,
      itemIds,
      actors,
      tagIds,
      tagNames,
      topics,
      excludeByIds,
      groupIds,
      isLimitSeries,
      filterEmptyContent,
      shouldHighlight,
    } = query;
    const body: BodyES = {
      query: {
        bool: {
          must: [...this._getContentNullFilter(filterEmptyContent)],
          must_not: [
            ...this._getContentEmptyStringFilter(filterEmptyContent),
            ...this._getNotIncludeIds(excludeByIds),
          ],
          filter: [
            ...this._getActorFilter(actors),
            ...this._getContentTypesFilter(contentTypes),
            ...this._getAudienceFilter(groupIds),
            ...this._getFilterTime(startTime, endTime),
            ...this._getItemInSeriesFilter(itemIds),
            ...this._getTagIdsFilter(tagIds),
            ...this._getTagNamesFilter(tagNames),
            ...this._getCategoryFilter(topics),
            ...(isLimitSeries ? this._limitSeriesFilter() : []),
          ],
          should: [...this._getMatchQueryFromKeyword(keyword)],
          minimum_should_match: keyword ? 1 : 0,
        },
      },
    };

    if (keyword && shouldHighlight) {
      body['highlight'] = this._getHighlight();
    }

    body['sort'] = [...this._getSort(keyword)];

    return body;
  }

  private _getHighlight(): any {
    const { content, summary, title } = ELASTIC_POST_MAPPING_PATH;
    return {
      ['pre_tags']: ['=='],
      ['post_tags']: ['=='],
      fields: {
        content: {
          ['matched_fields']: [content.default, content.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        summary: {
          ['matched_fields']: [summary.default, summary.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
        title: {
          ['matched_fields']: [title.default, title.ascii],
          type: 'fvh',
          ['number_of_fragments']: 0,
        },
      },
    };
  }

  private _getFilterTime(startTime: string, endTime: string): any {
    if (startTime || endTime) {
      const filterTime = {
        range: {
          publishedAt: {},
        },
      };

      if (startTime) {
        filterTime.range.publishedAt['gte'] = startTime;
      }
      if (endTime) {
        filterTime.range.publishedAt['lte'] = endTime;
      }
      return [filterTime];
    }
    return [];
  }

  private _getActorFilter(actors: string[]): any {
    const { createdBy } = ELASTIC_POST_MAPPING_PATH;
    if (actors && actors?.length) {
      return [
        {
          terms: {
            [createdBy]: actors,
          },
        },
      ];
    }
    return [];
  }

  private _getNotIncludeIds(ids: string[]): any {
    const { id } = ELASTIC_POST_MAPPING_PATH;
    if (ids && ids?.length) {
      return [
        {
          terms: {
            [id]: ids,
          },
        },
      ];
    }
    return [];
  }

  private _getCategoryFilter(categoryIds: string[]): any {
    const { categories } = ELASTIC_POST_MAPPING_PATH;
    if (categoryIds && categoryIds?.length) {
      return [
        {
          terms: {
            [categories.id]: categoryIds,
          },
        },
      ];
    }
    return [];
  }

  private _getAudienceFilter(filterGroupIds: string[]): any {
    const { groupIds } = ELASTIC_POST_MAPPING_PATH;
    if (filterGroupIds && filterGroupIds?.length) {
      return [
        {
          terms: {
            [groupIds]: filterGroupIds,
          },
        },
      ];
    }

    return [];
  }

  private _getItemInSeriesFilter(filterItemIds: string[]): any {
    const { items } = ELASTIC_POST_MAPPING_PATH;
    if (filterItemIds && filterItemIds?.length) {
      return [
        {
          terms: {
            [items.id]: filterItemIds,
          },
        },
      ];
    }

    return [];
  }

  private _limitSeriesFilter(): any {
    const { seriesIds } = ELASTIC_POST_MAPPING_PATH;
    return [
      {
        script: {
          script: {
            inline: `doc['${seriesIds}'].length < ${RULES.LIMIT_ATTACHED_SERIES} `,
          },
        },
      },
    ];
  }

  private _getSort(textSearch: string): any {
    if (textSearch) {
      return [{ ['_score']: 'desc' }, { publishedAt: 'desc' }];
    } else {
      return [{ publishedAt: 'desc' }];
    }
  }

  private _getMatchQueryFromKeyword(keyword: string): QueryDslQueryContainer[] {
    if (!keyword) {
      return [];
    }
    let fields: string[];
    const { title, summary, content } = ELASTIC_POST_MAPPING_PATH;
    const isASCII = StringHelper.isASCII(keyword);
    if (isASCII) {
      fields = [
        title.ascii,
        title.default,
        summary.ascii,
        summary.default,
        content.ascii,
        content.default,
      ];
    } else {
      fields = [title.default, summary.default, content.default];
    }
    return [
      {
        multi_match: {
          query: keyword,
          fields,
        },
      },
    ];
  }

  private _getContentTypesFilter(postTypes: CONTENT_TYPE[]): any {
    const { type } = ELASTIC_POST_MAPPING_PATH;
    if (postTypes && postTypes?.length) {
      return [
        {
          bool: {
            should: postTypes.map((contentType) => ({
              term: {
                [type]: contentType,
              },
            })),
          },
        },
      ];
    }
    return [];
  }

  private _getTagIdsFilter(tagIds: string[]): any {
    const { tags } = ELASTIC_POST_MAPPING_PATH;
    if (tagIds && tagIds?.length) {
      return [
        {
          terms: {
            [tags.id]: tagIds,
          },
        },
      ];
    }
    return [];
  }

  private _getTagNamesFilter(tagNames: string[]): any {
    const { tags } = ELASTIC_POST_MAPPING_PATH;
    if (tagNames && tagNames?.length) {
      return [
        {
          terms: {
            [tags.name]: tagNames,
          },
        },
      ];
    }
    return [];
  }

  private _getContentNullFilter(filterEmptyContent?: boolean): any {
    const { content } = ELASTIC_POST_MAPPING_PATH;
    if (filterEmptyContent) {
      return Object.values(content).map((code) => ({
        exists: {
          field: code,
        },
      }));
    }
    return [];
  }

  private _getContentEmptyStringFilter(filterEmptyContent?: boolean): any {
    const { content } = ELASTIC_POST_MAPPING_PATH;
    if (filterEmptyContent) {
      return Object.values(content).map((code) => ({
        term: {
          [code]: '',
        },
      }));
    }
    return [];
  }
}
