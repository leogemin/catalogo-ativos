import { BadRequestException, Injectable, type PipeTransform, UnsupportedMediaTypeException } from '@nestjs/common';

// Navegadores/SOs enviam CSV com MIME types variados (o Excel no Windows
// costuma mandar application/vnd.ms-excel), então a extensão também vale.
const CSV_MIME_TYPES = new Set(['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel']);

@Injectable()
export class CsvFilePipe implements PipeTransform<Express.Multer.File | undefined, Express.Multer.File> {
  transform(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) throw new BadRequestException('Envie o arquivo CSV no campo multipart "file".');
    const hasCsvExtension = file.originalname.toLowerCase().endsWith('.csv');
    if (!hasCsvExtension && !CSV_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeException('O arquivo precisa ser um CSV (.csv).');
    }
    return file;
  }
}
