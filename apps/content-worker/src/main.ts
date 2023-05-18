import { NestFactory } from '@nestjs/core';
import { ContentWorkerModule } from './content-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(ContentWorkerModule);
  await app.listen(3000);
}
bootstrap();
