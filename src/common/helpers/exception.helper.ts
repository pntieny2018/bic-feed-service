import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';

export class ExceptionHelper {
  public static throw(msg: unknown, status: number): void {
    throw new HttpException(msg, status);
  }

  public static throwBadRequestException(msg: unknown): void {
    throw new BadRequestException(msg);
  }

  public static throwNotFoundException(msg: unknown): void {
    throw new NotFoundException(msg);
  }
}
