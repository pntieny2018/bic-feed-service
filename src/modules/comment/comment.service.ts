import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CommentService {
  private _logger = new Logger(CommentService.name);

  public create(): void {
    this._logger.log('create comment');
  }

  public get(): void {
    this._logger.log('get comment');
  }

  public update(): void {
    this._logger.log('update comment');
  }

  public destroy(): void {
    this._logger.log('delete comment');
  }
}
