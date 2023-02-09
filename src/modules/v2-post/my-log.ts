import { ILogger } from '@beincom/domain';

export class MyLogger implements ILogger {
  public log(message: string, ...meta: unknown[]): void {
    console.log(message);
  }
  public debug(message: string, ...meta: unknown[]): void {
    console.log(message);
  }

  public error(message: string, trace?: unknown, ...meta: unknown[]): void {
    console.log(message);
  }

  public warn(message: string, ...meta: unknown[]): void {
    console.log(message);
  }

  public setContext(context: string): void {
    console.log(context);
  }
}
