import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CustomLogger extends Logger {
  private readonly isEnabled: boolean;

  public constructor(context?: string, isEnabled?: boolean) {
    super(context);
    this.isEnabled = isEnabled ?? true;
  }

  public log(message: string, context: string = this.context, isEnabled?: boolean): void {
    if (isEnabled === undefined) {
      isEnabled = this.isEnabled;
    }

    if (isEnabled) {
      Logger.log(message, context);
    }
  }

  public error(
    message: string,
    stack?: string,
    context: string = this.context,
    isEnabled?: boolean
  ): void {
    if (isEnabled === undefined) {
      isEnabled = this.isEnabled;
    }

    if (isEnabled) {
      Logger.error(message, stack, context);
    }
  }

  public warn(message: string, context: string = this.context, isEnabled?: boolean): void {
    if (isEnabled === undefined) {
      isEnabled = this.isEnabled;
    }

    if (isEnabled) {
      Logger.warn(message, context);
    }
  }

  public debug(message: string, context: string = this.context, isEnabled?: boolean): void {
    if (isEnabled === undefined) {
      isEnabled = this.isEnabled;
    }

    if (isEnabled) {
      Logger.debug(message, context);
    }
  }

  public verbose(message: string, context: string = this.context, isEnabled?: boolean): void {
    if (isEnabled === undefined) {
      isEnabled = this.isEnabled;
    }

    if (isEnabled) {
      Logger.verbose(message, context);
    }
  }
}
