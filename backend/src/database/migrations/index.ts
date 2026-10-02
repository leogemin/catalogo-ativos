import { InitialSchema1759190400000 } from './1759190400000-initial-schema.js';

// Lista explícita (em vez de glob) para funcionar igual em dist/ e nos testes.
// Toda migration nova precisa ser registrada aqui, em ordem.
export const migrations = [InitialSchema1759190400000];
