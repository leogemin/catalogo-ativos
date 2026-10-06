import { ScryptPasswordHasher } from './scrypt-password-hasher.js';

describe('ScryptPasswordHasher', () => {
  const hasher = new ScryptPasswordHasher();

  it('gera hashes com salt diferente e verifica só a senha correta', async () => {
    const first = await hasher.hash('segredo123');
    const second = await hasher.hash('segredo123');

    expect(first).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(first).not.toBe(second);
    expect(await hasher.verify('segredo123', first)).toBe(true);
    expect(await hasher.verify('segredo124', first)).toBe(false);
  });

  it('recusa hashes em formato desconhecido', async () => {
    expect(await hasher.verify('segredo123', 'bcrypt$abc')).toBe(false);
  });
});
