import { Controller, Delete, Get, Logger, Post, Put } from '@nestjs/common';

@Controller('posts')
export class PostController {
  private _logger = new Logger(PostController.name);

  @Post()
  public create(): void {
    this._logger.log('create post');
  }

  @Get()
  public get(): void {
    this._logger.log('get post');
  }

  @Put()
  public update(): void {
    this._logger.log('update post');
  }

  @Delete()
  public destroy(): void {
    this._logger.log('delete post');
  }
}
