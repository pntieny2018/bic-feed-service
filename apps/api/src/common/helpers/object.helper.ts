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
    const result = [];
    if (node.type === 'img' && node.url) {
      result.push({
        plateId: node.id,
        url: node.url,
      });
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((children) => {
        result.push(...ObjectHelper.nodeToUrlImages(children));
      });
    }
    return result;
  };

  public static contentReplaceUrl = (
    content: any,
    replaceList: { plateId: string; url: string }[]
  ) => {
    for (const item of content) {
      if (item.type === 'img') {
        const imageToUpdate = replaceList.find((image) => image.plateId === item.id);
        if (imageToUpdate) {
          item.url = imageToUpdate.url;
        }
      }
      if (item.children) {
        ObjectHelper.contentReplaceUrl(item.children, replaceList);
      }
    }
    return content;
  };
}

export type ClassConstructor<T> = {
  new (...args: any[]): T;
};
