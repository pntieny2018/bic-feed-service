import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TagFactory } from '../../../domain/model/tag/tag.factory';
import { TagRepository } from '../../../infrastructure/repository/tag.repository';

import { SavePostCommand } from './save-post.command';

@CommandHandler(SavePostCommand)
export class SavePostHandler implements ICommandHandler<SavePostCommand, void> {
  @Inject(InjectionToken.ACCOUNT_REPOSITORY)
  private readonly _tagRepository: TagRepository;
  @Inject() private readonly _tagFactory: TagFactory;
  @Inject(PASSWORD_GENERATOR)
  private readonly passwordGenerator: PasswordGenerator;

  async execute(command: OpenAccountCommand): Promise<void> {
    const account = this.accountFactory.create({
      ...command,
      id: await this.accountRepository.newId(),
      password: this.passwordGenerator.generateKey(command.password),
    });

    account.open();

    await this.accountRepository.save(account);

    account.commit();
  }
}
