import { Logger } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { CommandModule } from './command.module';

async function bootstrap(): Promise<void> {
  await CommandFactory.run(CommandModule, ['log']);
}

bootstrap().catch((ex) => Logger.debug(JSON.stringify(ex?.stack)));
