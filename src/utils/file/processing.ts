import { FileData } from '@/types/data';
import { createError } from '../core/error';
import { validateFile } from './validation';
import { parse } from 'papaparse';
import * as XLSX from 'xlsx';

const CHUNK_SIZE = 500000;

interface ProcessingResult {
  success: boolean;
  data?: FileData;
  error?: string;
}

export async function processFile(file: File): Promise<FileData> {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw createError('INVALID_INPUT', validation.error || 'Invalid file');
    }

    // Create processing worker
    const worker = new Worker(
      new URL('./workers/csv.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Process based on file type
    const extension = file.name.toLowerCase().split('.').pop();
    let result: ProcessingResult;

    switch (extension) {
      case 'csv':
        result = await processCSVWithValidation(file);
        break;
      case 'xlsx':
      case 'xls':
        result = await processExcelWithValidation(file);
        break;
      default:
        throw createError('INVALID_INPUT', 'Unsupported file type');
    }

    // Validate processed data
    if (!result.success || !result.data || !validateProcessedData(result.data)) {
      throw createError('PROCESSING_FAILED', result.error || 'Failed to process file');
    }

    worker.terminate();
    return result.data;
  } catch (error) {
    console.error('File processing error:', error);
    throw error instanceof Error ? error : createError('PROCESSING_FAILED', 'Failed to process file');
  }
}

async function processCSVWithValidation(file: File): Promise<ProcessingResult> {
  return new Promise((resolve) => {
    const headers: string[] = [];
    const fieldValues: Record<string, any[]> = {};
    let rowCount = 0;

    parse(file, {
      chunk: (results) => {
        try {
          const rows = results.data as any[][];
          if (rowCount === 0 && rows.length > 0) {
            headers.push(...rows[0].map(String));
            headers.forEach(header => {
              fieldValues[header] = [];
            });
            rows.slice(1).forEach(row => {
              headers.forEach((header, i) => {
                fieldValues[header].push(row[i]);
              });
            });
          } else {
            rows.forEach(row => {
              headers.forEach((header, i) => {
                fieldValues[header].push(row[i]);
              });
            });
          }
          rowCount += rows.length;
        } catch (error) {
          console.error('CSV chunk processing error:', error);
        }
      },
      complete: () => {
        if (headers.length === 0) {
          resolve({
            success: false,
            error: 'No headers found in CSV'
          });
          return;
        }

        const fields = headers.map(header => ({
          name: header,
          type: inferFieldType(fieldValues[header]),
          value: fieldValues[header]
        }));

        resolve({
          success: true,
          data: {
            type: 'csv',
            content: { fields },
            name: file.name
          }
        });
      },
      error: (error) => {
        resolve({
          success: false,
          error: error.message
        });
      },
      header: false,
      skipEmptyLines: true,
      chunkSize: CHUNK_SIZE
    });
  });
}

async function processExcelWithValidation(file: File): Promise<ProcessingResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);

    if (!workbook.SheetNames.length) {
      return {
        success: false,
        error: 'Excel file contains no sheets'
      };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd',
      blankrows: false
    });

    if (!jsonData || jsonData.length < 2) {
      return {
        success: false,
        error: 'Invalid or empty Excel file'
      };
    }

    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1) as any[][];
    const fields = headers.map((name, columnIndex) => {
      const columnValues = rows.map(row => row[columnIndex]);
      return {
        name: String(name),
        type: inferFieldType(columnValues),
        value: columnValues
      };
    });

    return {
      success: true,
      data: {
        type: 'csv',
        content: { fields },
        name: file.name
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process Excel file'
    };
  }
}

function inferFieldType(values: any[]): 'number' | 'string' | 'date' {
  const nonNullValues = values.filter(v => v != null && v !== '');
  if (nonNullValues.length === 0) return 'string';
  const types = nonNullValues.map(value => {
    // Handle Excel date numbers
    if (typeof value === 'number' && value > 25569 && value < 50000) {
      return 'date';
    }
    
    // Handle regular numbers
    if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
      return 'number';
    }
    
    // Handle dates
    const dateStr = String(value);
    if (!isNaN(Date.parse(dateStr))) {
      return 'date';
    }
    
    return 'string';
  });

  const uniqueTypes = [...new Set(types)];
  if (uniqueTypes.length === 1) return uniqueTypes[0] as 'number' | 'string' | 'date';
  if (uniqueTypes.includes('number') && uniqueTypes.length === 2 && uniqueTypes.includes('string')) {
    return 'number'; // Handle cases where some numbers are stored as strings
  }
  return 'string';
}

function validateProcessedData(data: FileData): boolean {
  // Validate basic structure
  if (!data || typeof data !== 'object') return false;
  if (!data.type || !data.name) return false;
  if (!data.content || !Array.isArray(data.content.fields)) return false;
  if (data.content.fields.length === 0) return false;

  // Validate each field
  return data.content.fields.every(field => 
    field &&
    typeof field === 'object' &&
    typeof field.name === 'string' &&
    field.name.length > 0 &&
    typeof field.type === 'string' &&
    ['number', 'string', 'date'].includes(field.type) &&
    Array.isArray(field.value) &&
    field.value.length > 0
  );
}