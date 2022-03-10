import { Controller, Delete, Get, Logger, Post, Put } from '@nestjs/common';

@Controller('comments')
export class CommentController {
  private _logger = new Logger(CommentController.name);

  @Post()
  public create(): void {
    this._logger.log('create comment');
  }

  @Get()
  public get(): void {
    this._logger.log('get comment');
  }

  @Put()
  public update(): void {
    this._logger.log('update comment');
  }

  @Delete()
  public destroy(): void {
    this._logger.log('delete comment');
  }
}
