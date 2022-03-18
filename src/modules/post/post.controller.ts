import { UserSharedDto } from './../../shared/user/dto/user-shared.dto';
import { AuthUser } from './../auth/decorators/auth.decorator';
import { Controller, Delete, Get, Post, Body, Param, ParseIntPipe, Put } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/requests';
import { GenericApiOkResponse } from '../../common/decorators';
import { UpdatePostDto } from './dto/requests/update-post.dto';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller('posts')
export class PostController {
  public constructor(private _postService: PostService) {}

  @ApiOperation({ summary: 'Create post' })
  @GenericApiOkResponse(Boolean, 'Create post successfully')
  @Post('/')
  public createPost(
    @AuthUser() user: UserSharedDto,
    @Body() createPostDto: CreatePostDto
  ): Promise<boolean> {
    return this._postService.createPost(user, createPostDto);
  }

  @ApiOperation({ summary: 'Update post' })
  @GenericApiOkResponse(Boolean, 'Update post successfully')
  @Put('/:postId')
  public updatePost(
    @AuthUser() user: UserSharedDto,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createPostDto: UpdatePostDto
  ): Promise<boolean> {
    return this._postService.updatePost(postId, user, createPostDto);
  }

  @Get('/:id')
  public getPost(@Param('id', ParseIntPipe) id: number) {
    return this._postService.getPost(id);
  }

  @Delete('/:id/delete')
  public deletePost(@Param('id', ParseIntPipe) id: number) {
    // return this._postService.delete(user.beinUserId, id);
  }
}
