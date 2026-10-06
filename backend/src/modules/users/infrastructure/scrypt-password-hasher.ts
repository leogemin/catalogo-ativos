import { randomBytes, scrypt, type ScryptOptions, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../domain/password-hasher.js';

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PARAMS: ScryptOptions = { N: 16384, r: 8, p: 1 };

function deriveKey(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/**
 * scrypt nativo do Node (sem dependência nativa extra). Formato guardado:
 * `scrypt$N$r$p$<salt base64>$<hash base64>`, para poder mudar os parâmetros
 * no futuro sem invalidar senhas antigas.
 */
@Injectable()
export class ScryptPasswordHasher extends PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await deriveKey(password, salt, PARAMS);
    return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [algorithm, n, r, p, salt, key] = hash.split('$');
    if (algorithm !== 'scrypt' || !salt || !key) return false;

    const expected = Buffer.from(key, 'base64');
    const actual = await deriveKey(password, Buffer.from(salt, 'base64'), { N: Number(n), r: Number(r), p: Number(p) });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
