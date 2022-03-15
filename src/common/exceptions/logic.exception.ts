export class LogicException extends Error {
  public constructor(public id: string) {
    super();
  }
}
