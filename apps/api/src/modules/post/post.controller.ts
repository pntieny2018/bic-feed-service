import { UserDto } from '@libs/service/user';
import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../common/constants';
import { AuthUser, ResponseMessages } from '../../common/decorators';

import { PostAppService } from './application/post.app-service';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'posts',
})
export class PostController {
  public constructor(private _postAppService: PostAppService) {}

  @ApiOperation({ summary: 'Get total draft posts' })
  @ApiOkResponse({
    type: Number,
  })
  @Get('/total-draft')
  public async getTotalDraft(@AuthUser() user: UserDto): Promise<any> {
    return this._postAppService.getTotalDraft(user);
  }

  @ApiOperation({ summary: 'Mark as read' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Put('/:id/mark-as-read')
  public async markRead(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.markReadPost(user, postId);
  }

  @ApiOperation({ summary: 'Save post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @ResponseMessages({
    success: 'message.post.saved_success',
  })
  @Post('/:postId/save')
  public async save(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.savePost(user, postId);
  }

  @ApiOperation({ summary: 'unsave post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @ResponseMessages({
    success: 'message.post.unsaved_success',
  })
  @Delete('/:postId/unsave')
  public async unSave(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.unSavePost(user, postId);
  }
}
