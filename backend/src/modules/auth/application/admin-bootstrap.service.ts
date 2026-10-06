import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import { UsersService } from '../../users/application/users.service.js';
import { ADMIN_USERNAME } from '../../users/domain/user.entity.js';

/** Garante que o usuário admin exista, criando-o com ADMIN_PASSWORD na primeira subida. */
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const password = this.config.get('ADMIN_PASSWORD', { infer: true });
    try {
      if (!password) {
        if (!(await this.users.findByUsername(ADMIN_USERNAME))) {
          this.logger.warn(`Usuário "${ADMIN_USERNAME}" não existe e ADMIN_PASSWORD não foi definida.`);
        }
        return;
      }
      if (await this.users.ensureAdmin(password)) {
        this.logger.log(`Usuário "${ADMIN_USERNAME}" criado a partir de ADMIN_PASSWORD.`);
      }
    } catch (error) {
      // Ex.: migrations ainda não aplicadas. A API sobe mesmo assim.
      this.logger.error(`Não foi possível garantir o usuário "${ADMIN_USERNAME}": ${(error as Error).message}`);
    }
  }
}
