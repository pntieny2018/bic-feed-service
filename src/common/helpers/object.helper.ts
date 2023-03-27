import { StringHelper } from './string.helper';
import { NodePlateContent } from '../types/node-image.type ';

export class ObjectHelper {
  public static omit<T extends object = object>(keys: string[], obj: T): Partial<T> {
    return (keys as any).reduce((a: Partial<T>, e: keyof T) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [e]: omitted, ...rest } = a;
      return rest;
    }, obj);
  }

  public static convertKeysToCamelCase(obj: object): object {
    const camelCaseObj = {};
    Object.keys(obj).forEach((key) => {
      camelCaseObj[StringHelper.snakeToCamelCase(key)] = obj[key];
    });
    return camelCaseObj;
  }

  public static nodeToUrlImages = (node: Partial<NodePlateContent>) => {
    let urls = [];
    if (node.type === 'img' && node.url) {
      urls.push(node.url);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((children) => {
        urls = urls.concat(ObjectHelper.nodeToUrlImages(children));
      });
    }
    return urls;
  };
}

export type ClassConstructor<T> = {
  new (...args: any[]): T;
};
