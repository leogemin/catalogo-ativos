import { InvalidInputError } from '../../../common/errors/domain.errors.js';
import { CatalogItemType } from '../domain/catalog-item-type.enum.js';
import { CatalogCsvService } from './catalog-csv.service.js';

describe('CatalogCsvService', () => {
  const csv = new CatalogCsvService();

  describe('parse', () => {
    it('lê CSV com vírgula, BOM e converte "—" em null', () => {
      const parsed = csv.parse(
        '﻿tipo,categoria,especie,suplementos,fijacion\r\n' +
          'ASSET,MUEBLES,ACONDICIONADOR DE AIRE,MCA/MOD/POTENCIA EN BTU/H,A CERCA DE LA PLACA DEL FABRICANTE\r\n' +
          'ASSET,GOODWILL,ACTIVOS FIJOS,—,—\r\n',
      );

      expect(parsed.delimiter).toBe(',');
      expect(parsed.rows).toEqual([
        {
          line: 2,
          item: {
            type: CatalogItemType.ASSET,
            categoria: 'MUEBLES',
            especie: 'ACONDICIONADOR DE AIRE',
            suplementos: 'MCA/MOD/POTENCIA EN BTU/H',
            fijacion: 'A CERCA DE LA PLACA DEL FABRICANTE',
          },
        },
        {
          line: 3,
          item: {
            type: CatalogItemType.ASSET,
            categoria: 'GOODWILL',
            especie: 'ACTIVOS FIJOS',
            suplementos: null,
            fijacion: null,
          },
        },
      ]);
    });

    it('detecta ";" e aceita cabeçalhos em pt/es em qualquer ordem, sem coluna tipo', () => {
      const parsed = csv.parse('Espécie;Fixação da placa;Categoría\nESCANER;FICTICIO;EQUIPOS DE COMPUTO\n');

      expect(parsed.delimiter).toBe(';');
      expect(parsed.rows[0]).toEqual({
        line: 2,
        item: {
          type: CatalogItemType.ASSET,
          categoria: 'EQUIPOS DE COMPUTO',
          especie: 'ESCANER',
          suplementos: null,
          fijacion: 'FICTICIO',
        },
      });
    });

    it('mapeia sinônimos de tipo e permite NON_OBJECT sem categoria', () => {
      const parsed = csv.parse('tipo,especie\nBien no objeto,ALFOMBRA\nativo,MESA\n');

      expect(parsed.rows[0]).toMatchObject({ item: { type: CatalogItemType.NON_OBJECT, especie: 'ALFOMBRA' } });
      // "ativo" vira ASSET, que exige categoria.
      expect(parsed.rows[1]).toEqual({
        line: 3,
        errors: ['categoria é obrigatória para itens do tipo ASSET'],
      });
    });

    it('reporta erros por linha sem abortar o parse', () => {
      const parsed = csv.parse('tipo,categoria,especie\nXPTO,MUEBLES,SILLA\nASSET,MUEBLES,\n');

      expect(parsed.rows).toEqual([
        { line: 2, errors: ['tipo inválido: "XPTO" (use ASSET ou NON_OBJECT)'] },
        { line: 3, errors: ['especie é obrigatória'] },
      ]);
    });

    it('preserva vírgulas dentro de campos entre aspas', () => {
      const parsed = csv.parse('categoria,especie,suplementos\nMUEBLES,MESA,"MCA/MOD/DIMENSIÓN (ANC, PROF, ALT)"\n');
      expect(parsed.rows[0]).toMatchObject({ item: { suplementos: 'MCA/MOD/DIMENSIÓN (ANC, PROF, ALT)' } });
    });

    it.each([
      ['vazio', '   \n'],
      ['sem coluna especie', 'categoria,fijacion\nMUEBLES,FICTICIO\n'],
      ['só cabeçalho', 'especie,categoria\n'],
      ['colunas duplicadas', 'especie,nombre\nA,B\n'],
      ['aspas não fechadas', 'especie,categoria\n"MESA,MUEBLES\n'],
    ])('rejeita arquivo %s', (_, content) => {
      expect(() => csv.parse(content)).toThrow(InvalidInputError);
    });
  });

  describe('serialize', () => {
    it('gera CSV com BOM que volta idêntico no parse (round-trip)', () => {
      const items = [
        {
          type: CatalogItemType.ASSET,
          categoria: 'MUEBLES',
          especie: 'MESA; "GRANDE"',
          suplementos: 'MCA/MOD/',
          fijacion: null,
        },
        { type: CatalogItemType.NON_OBJECT, categoria: null, especie: 'ALFOMBRA', suplementos: null, fijacion: null },
      ];

      for (const delimiter of [',', ';'] as const) {
        const output = csv.serialize(items, delimiter);
        expect(output.startsWith('﻿tipo' + delimiter)).toBe(true);
        expect(csv.parse(output).rows.map((row) => ('item' in row ? row.item : row))).toEqual(items);
      }
    });
  });
});
