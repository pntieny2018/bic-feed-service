import { UserService } from '@libs/service/user/src/user.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
