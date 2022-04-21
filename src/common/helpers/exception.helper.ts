import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { LogicException } from '../exceptions';

export class ExceptionHelper {
  public static throw(msg: unknown, status: number): void {
    throw new HttpException(msg, status);
  }

  public static throwBadRequestException(msg: unknown): void {
    throw new BadRequestException(msg);
  }

  public static throwLogicException(id: string): void {
    throw new LogicException(id);
  }

  public static throwNotFoundException(msg: unknown): void {
    throw new NotFoundException(msg);
  }
}
