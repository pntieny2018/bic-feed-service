import { Module } from '@nestjs/common';
import { UserService } from '@app/service/user/src/user.service';

@Module({
  imports: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
