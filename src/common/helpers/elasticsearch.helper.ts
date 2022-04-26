import { getElasticsearchConfig } from '../../config/elasticsearch';

export class ElasticsearchHelper {
  private static _prefix = getElasticsearchConfig().namespace + '_';
  public static INDEX = {
    POST: ElasticsearchHelper._addPrefix('posts'),
  };

  private static _addPrefix(index: string): string {
    return ElasticsearchHelper._prefix + index;
  }
}
