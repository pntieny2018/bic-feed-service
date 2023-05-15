import { Injectable } from '@nestjs/common';
import { ICommentValidator } from './interface/comment.validator.interface';

@Injectable()
export class CommentValidator implements ICommentValidator {}
