import { Controller, Delete, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/requests';

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
  public createPost(@Body() createPostDto: CreatePostDto) {
    return this._postService.createPost(111, createPostDto);
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
