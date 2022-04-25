import { getElasticsearchConfig } from '../../config/elasticsearch';

export class ElasticsearchHelper {
  private static _prefix = getElasticsearchConfig().namespace + '_';
  public static INDEX = {
    POST: ElasticsearchHelper._addPrefix('posts'),
    POST_EDITED_HISTORY: ElasticsearchHelper._addPrefix('post_edited_history'),
  };

  private static _addPrefix(index: string): string {
    return ElasticsearchHelper._prefix + index;
  }
}
