/** Hash de senhas; a aplicação não conhece o algoritmo usado. */
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract verify(password: string, hash: string): Promise<boolean>;
}
