import { UserDto } from '../../auth';
import { InjectModel } from '@nestjs/sequelize';
import { ProcessVideoResponseDto } from './dto';
import { Injectable, Logger } from '@nestjs/common';
import { ProcessStatus } from './process-status.enum';
import { CreatePostDto, UpdatePostDto } from '../dto/requests';
import { IPost, PostModel } from '../../../database/models/post.model';

@Injectable()
export class CreateVideoPostService {
  private readonly _logger = new Logger(CreateVideoPostService.name);

  public constructor(@InjectModel(PostModel) private readonly _postModel: typeof PostModel) {}

  public async publishOrRejectVideoPost(
    processVideoResponseDto: ProcessVideoResponseDto
  ): Promise<void> {
    switch (processVideoResponseDto.status) {
      case ProcessStatus.DONE:
        return this.publishVideoPost(processVideoResponseDto);
      case ProcessStatus.ERROR:
        return this.rejectVideoPost(processVideoResponseDto);
    }
  }

  public async publishVideoPost(processVideoResponseDto: ProcessVideoResponseDto): Promise<void> {
    //set hidden = false
  }

  public async rejectVideoPost(processVideoResponseDto: ProcessVideoResponseDto): Promise<void> {
    //sent to noti 
    // check post is publish
    // this._notificationService.publishPostNotification({
    //   key: `${post.id}`,
    //   value: {
    //     actor,
    //     event: event.getEventName(), PostVideoHasBeenPublished
    //     data: activity,
    //   },
    // });
  }
}
