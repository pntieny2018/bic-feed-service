import { UserSharedDto } from './../../shared/user/dto/user-shared.dto';
import { AuthUser } from './../auth/decorators/auth.decorator';
import { Controller, Delete, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/requests';
import { GenericApiOkResponse } from '../../common/decorators';

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

  @Get('/:id')
  public getPost(@Param('id', ParseIntPipe) id: number) {
    return this._postService.getPost(id);
  }

  @Delete('/:id/delete')
  public deletePost(@Param('id', ParseIntPipe) id: number) {
    // return this._postService.delete(user.beinUserId, id);
  }
}
