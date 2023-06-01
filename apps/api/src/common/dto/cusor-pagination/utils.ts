import { CursorParam } from './paginated.interface';

export function parseCursor(cursor: string): CursorParam {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
}

export function createCursor(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
