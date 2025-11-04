import {
  sanitizeFileName,
  getFileExtension,
  getFileNameWithoutExtension,
  hasAllowedExtension,
  formatFileSize,
  readFileAsArrayBuffer,
} from './file.utils';

describe('File Utils', () => {
  describe('sanitizeFileName', () => {
    it('should remove path separators', () => {
      expect(sanitizeFileName('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFileName('folder\\file.txt')).toBe('folderfile.txt');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeFileName('file<>:"|?*.txt')).toBe('file.txt');
    });

    it('should remove leading and trailing dots', () => {
      expect(sanitizeFileName('...file.txt...')).toBe('file.txt');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFileName('  file.txt  ')).toBe('file.txt');
    });

    it('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt';
      expect(sanitizeFileName(longName).length).toBeLessThanOrEqual(255);
    });
  });

  describe('getFileExtension', () => {
    it('should return extension with dot', () => {
      expect(getFileExtension('file.txt')).toBe('.txt');
      expect(getFileExtension('archive.tar.gz')).toBe('.gz');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('file')).toBe('');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('FILE.TXT')).toBe('.txt');
    });
  });

  describe('getFileNameWithoutExtension', () => {
    it('should return filename without extension', () => {
      expect(getFileNameWithoutExtension('file.txt')).toBe('file');
      expect(getFileNameWithoutExtension('archive.tar.gz')).toBe('archive.tar');
    });

    it('should return full name if no extension', () => {
      expect(getFileNameWithoutExtension('file')).toBe('file');
    });
  });

  describe('hasAllowedExtension', () => {
    it('should return true for allowed extensions', () => {
      expect(hasAllowedExtension('file.ifc', ['.ifc', '.json'])).toBeTrue();
      expect(hasAllowedExtension('FILE.IFC', ['.ifc', '.json'])).toBeTrue();
    });

    it('should return false for disallowed extensions', () => {
      expect(hasAllowedExtension('file.txt', ['.ifc', '.json'])).toBeFalse();
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
      expect(formatFileSize(1536, 1)).toBe('1.5 KB');
    });
  });

  describe('readFileAsArrayBuffer', () => {
    it('should read file as Uint8Array', async () => {
      const file = new File(['test content'], 'test.txt');
      const result = await readFileAsArrayBuffer(file);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.byteLength).toBeGreaterThan(0);
    });
  });
});
