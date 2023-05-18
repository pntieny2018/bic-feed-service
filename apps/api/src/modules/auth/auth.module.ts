import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { UserModuleV2 } from '../v2-user/user.module';

@Module({
  imports: [HttpModule, UserModuleV2],
  providers: [AuthService],

  exports: [AuthService],
})
export class AuthModule {}
