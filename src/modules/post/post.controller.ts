import { PostDto } from './dto/responses/post.dto';
import { AuthUser } from './../auth/decorators/auth.decorator';
import { UserDto } from './../auth/dto/user.dto';
import { Controller, Delete, Get, Post, Query, Res, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto, GetPostDto } from './dto/requests';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller('posts')
export class PostController {
  public constructor(private _postService: PostService) {}

  @ApiOperation({ summary: 'Create post' })
  @ApiOkResponse({
    description: 'Create post successfully',
    type: String,
  })
  @Post('/')
  public createPost(@AuthUser() user: UserDto, @Body() createPostDto: CreatePostDto): Promise<PostDto> {
    console.log(createPostDto);
    return this._postService.createPost(user.userId, createPostDto);
  }

  @ApiOperation({ summary: 'Delete recent search' })
  @ApiParam({
    name: 'id',
    description: 'Id of recent search item',
  })
  @ApiOkResponse({
    description: 'Delete recent search successfully',
    type: Boolean,
  })
  @Delete('/:id/delete')
  public deletePostForPost(@Param('id', ParseIntPipe) id: number) {
    // return this._postService.delete(user.beinUserId, id);
  }
}
