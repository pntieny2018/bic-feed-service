import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from '../../shared/user';

@Module({
  imports: [HttpModule, UserModule],
  providers: [AuthService],

  exports: [AuthService],
})
export class AuthModule {}
