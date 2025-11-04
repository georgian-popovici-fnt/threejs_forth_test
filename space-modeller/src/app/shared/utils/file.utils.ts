/**
 * Utility functions for file operations
 */

/**
 * Sanitize a filename to remove potentially dangerous characters
 * @param fileName - The filename to sanitize
 * @returns Sanitized filename safe for use in file systems
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and dangerous characters
  return fileName
    .replace(/[/\\]/g, '')
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .trim()
    .substring(0, 255); // Limit to 255 characters (common filesystem limit)
}

/**
 * Get file extension from filename
 * @param fileName - The filename
 * @returns File extension including the dot, or empty string if no extension
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot).toLowerCase() : '';
}

/**
 * Get file name without extension
 * @param fileName - The filename
 * @returns Filename without extension
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
}

/**
 * Check if file extension is allowed
 * @param fileName - The filename to check
 * @param allowedExtensions - Array of allowed extensions (e.g., ['.ifc', '.json'])
 * @returns True if extension is allowed
 */
export function hasAllowedExtension(fileName: string, allowedExtensions: readonly string[]): boolean {
  const extension = getFileExtension(fileName);
  return allowedExtensions.some(allowed => extension === allowed.toLowerCase());
}

/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Read file as ArrayBuffer
 * @param file - The File object to read
 * @returns Promise resolving to Uint8Array
 */
export async function readFileAsArrayBuffer(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
