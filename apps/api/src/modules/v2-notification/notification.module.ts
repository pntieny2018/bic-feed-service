import { Module } from '@nestjs/common';
import { PostPublishedConsumer } from './driving-apdater/consumer/post-published.consumer';

@Module({
  imports: [],
  controllers: [PostPublishedConsumer],
  providers: [],
  exports: [],
})
export class NotificationModuleV2 {}
