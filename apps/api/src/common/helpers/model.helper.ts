import { WhereOptions } from 'sequelize';

export class ModelHelper {
  public static async getAllRecursive<T>(
    model: any,
    conditions: WhereOptions,
    _limit = 1000,
    _offset = 0,
    _posts: T[] = [],
    _lastResultLength = 0
  ): Promise<T[]> {
    if (_offset > 0 && _lastResultLength < _limit) return _posts;
    const posts = await model.findAll({
      where: conditions,
      limit: _limit,
      offset: _offset,
    });
    return this.getAllRecursive<T>(
      model,
      conditions,
      _limit,
      _offset + _limit,
      _posts.concat(posts),
      posts.length
    );
  }
}
