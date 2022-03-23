import { AuthUser } from './../auth/decorators/auth.decorator';
import { Controller, Delete, Get, Post, Body, Param, ParseIntPipe, Put } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/requests';
import { GenericApiOkResponse } from '../../common/decorators';
import { UpdatePostDto } from './dto/requests/update-post.dto';
import { UserDto } from '../auth';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller('posts')
export class PostController {
  public constructor(private _postService: PostService) {}

  @ApiOperation({ summary: 'Create post' })
  @GenericApiOkResponse(Boolean, 'Create post successfully')
  @Post('/')
  public createPost(
    @AuthUser() user: UserDto,
    @Body() createPostDto: CreatePostDto
  ): Promise<boolean> {
    return this._postService.createPost(user.userId, createPostDto);
  }

  @ApiOperation({ summary: 'Update post' })
  @GenericApiOkResponse(Boolean, 'Update post successfully')
  @Put('/:postId')
  public updatePost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createPostDto: UpdatePostDto
  ): Promise<boolean> {
    return this._postService.updatePost(postId, user.userId, createPostDto);
  }

  @ApiOperation({ summary: 'Publish post' })
  @GenericApiOkResponse(Boolean, 'Publish post successfully')
  @Put('/:postId/publish')
  public publishPost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number
  ): Promise<boolean> {
    return this._postService.publishPost(postId, user.userId);
  }

  @Get('/:id')
  public getPost(@Param('id', ParseIntPipe) id: number) {
    return this._postService.getPost(id);
  }

  @Delete('/:id/delete')
  public deletePost(
    @AuthUser() user: UserDto,
    @Param('id', ParseIntPipe) postId: number
  ): Promise<boolean> {
    return this._postService.deletePost(postId, user.userId);
  }
}
