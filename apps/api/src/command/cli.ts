import { Logger } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';

import { CommandModule } from './command.module';

export async function bootstrapCLI(): Promise<void> {
  try {
    await CommandFactory.run(CommandModule, ['log']);
  } catch (ex) {
    Logger.debug(JSON.stringify(ex?.stack));
  }
}
