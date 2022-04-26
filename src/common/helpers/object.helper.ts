export class ObjectHelper {
  public static omit<T extends object = object>(keys: string[], obj: T): Partial<T> {
    return (keys as any).reduce((a: Partial<T>, e: keyof T) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [e]: omitted, ...rest } = a;
      return rest;
    }, obj);
  }
}

export type ClassConstructor<T> = {
  new (...args: any[]): T;
};
