import { DomainAggregateRoot } from '../domain-model/domain-aggregate-root';

export class EntityHelper {
  public static entityArrayToMap<T extends DomainAggregateRoot>(
    entities: T[],
    key: string
  ): Map<string, T> {
    return entities.reduce((map, entity) => {
      const mapKey = entity.get(key);

      if (!mapKey) {
        throw new Error(`Missing key for ${entity.constructor.name} map`);
      }

      map.set(mapKey, entity);
      return map;
    }, new Map());
  }

  public static entityArrayToArrayMap<T extends DomainAggregateRoot>(
    entities: T[],
    key: string
  ): Map<string, T[]> {
    return entities.reduce((map, entity) => {
      const mapKey = entity.get(key);

      if (!mapKey) {
        throw new Error(`Missing key for ${entity.constructor.name} map`);
      }

      let array = map.get(mapKey);

      if (!array) {
        array = [entity];
      } else {
        array.push(entity);
      }

      map.set(mapKey, array);
      return map;
    }, new Map());
  }

  public static entityArrayToRecord<T extends DomainAggregateRoot>(
    entities: T[],
    key: string
  ): Record<string, T> {
    return entities.reduce((record, entity) => {
      const recordKey = entity.get(key);

      if (!recordKey) {
        throw new Error(`Missing key for ${entity.constructor.name} record`);
      }

      record[recordKey] = entity;
      return record;
    }, {});
  }

  public static entityArrayToArrayRecord<T extends DomainAggregateRoot>(
    entities: T[],
    key: string
  ): Record<string, T[]> {
    return entities.reduce((record, entity) => {
      const recordKey = entity.get(key);

      if (!recordKey) {
        throw new Error(`Missing key for ${entity.constructor.name} record`);
      }

      let array = record[recordKey];

      if (!array) {
        array = [entity];
      } else {
        array.push(entity);
      }

      record[recordKey] = array;
      return record;
    }, {});
  }
}
