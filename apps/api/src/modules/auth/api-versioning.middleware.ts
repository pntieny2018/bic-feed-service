import { Request } from 'express';
import { AuthService } from './auth.service';
import { BadRequestException, Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { LogicException } from '../../common/exceptions';
import {
  HTTP_STATUS_ID,
  MINIMUM_VERSION_SUPPORT,
  VERSION_HEADER_KEY,
  VERSIONS_SUPPORTED,
} from '../../common/constants';
import semver from 'semver';

@Injectable()
export class ApiVersioningMiddleware implements NestMiddleware {
  public constructor(private _authService: AuthService) {}

  public async use(req: Request, res: Response, next: () => void): Promise<void> {
    if (!req.headers[VERSION_HEADER_KEY]) {
      req.headers[VERSION_HEADER_KEY] = VERSIONS_SUPPORTED[0];
    } else {
      const version = req.headers[VERSION_HEADER_KEY] as string;
      if (!semver.valid(version)) {
        throw new BadRequestException(`Version ${version} is not valid.`);
      }
      if (semver.lt(version, MINIMUM_VERSION_SUPPORT)) {
        throw new BadRequestException(
          `Version ${version} is not supported. Please use version ${VERSIONS_SUPPORTED[0]} or higher.`
        );
      }
      if (
        semver.gt(version, VERSIONS_SUPPORTED[VERSIONS_SUPPORTED.length - 1]) ||
        VERSIONS_SUPPORTED.indexOf(version) === -1
      ) {
        throw new NotFoundException(
          `Couldn't find any versions for "${version}". Please use one of the following versions: ${VERSIONS_SUPPORTED.join(
            ', '
          )}`
        );
      }
    }

    next();
  }
}
