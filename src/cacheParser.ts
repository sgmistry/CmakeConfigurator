import * as fs from 'fs';
import * as path from 'path';
import { CMakeCacheEntry } from './types.js';

export class CacheParser {
  /**
   * Parse a CMakeCache.txt file into structured entries.
   */
  public static parse(cacheFilePath: string): CMakeCacheEntry[] {
    if (!fs.existsSync(cacheFilePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(cacheFilePath, 'utf8');
      return this.parseContent(content);
    } catch (err) {
      console.error(`Error reading CMakeCache at ${cacheFilePath}:`, err);
      return [];
    }
  }

  /**
   * Parse the string content of CMakeCache.txt
   */
  public static parseContent(content: string): CMakeCacheEntry[] {
    const lines = content.split(/\r?\n/);
    const entriesMap = new Map<string, CMakeCacheEntry>();
    const advancedVars = new Set<string>();

    let currentHelp = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        currentHelp = '';
        continue;
      }

      // Help string line
      if (line.startsWith('//')) {
        currentHelp = line.substring(2).trim();
        continue;
      }

      // Comment line with '#'
      if (line.startsWith('#')) {
        continue;
      }

      // Check for KEY:TYPE=VALUE
      const eqIdx = line.indexOf('=');
      const colonIdx = line.indexOf(':');

      if (colonIdx > 0 && eqIdx > colonIdx) {
        const key = line.substring(0, colonIdx);
        const type = line.substring(colonIdx + 1, eqIdx).trim() as CMakeCacheEntry['type'];
        const value = line.substring(eqIdx + 1);

        if (key.endsWith('-ADVANCED')) {
          const varName = key.substring(0, key.length - '-ADVANCED'.length);
          if (value === '1' || value.toLowerCase() === 'true') {
            advancedVars.add(varName);
          }
          continue;
        }

        // Ignore internal or static variables from default display
        if (type === 'INTERNAL' || type === 'STATIC') {
          continue;
        }

        entriesMap.set(key, {
          name: key,
          type,
          value,
          help: currentHelp,
          advanced: false
        });

        currentHelp = '';
      }
    }

    // Apply advanced flags
    for (const [key, entry] of entriesMap.entries()) {
      if (advancedVars.has(key)) {
        entry.advanced = true;
      }
    }

    return Array.from(entriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Update or insert a cache entry in CMakeCache.txt directly
   */
  public static updateEntry(cacheFilePath: string, name: string, type: string, value: string): boolean {
    if (!fs.existsSync(cacheFilePath)) {
      return false;
    }

    try {
      const content = fs.readFileSync(cacheFilePath, 'utf8');
      const lines = content.split(/\r?\n/);
      let found = false;

      const updatedLines = lines.map(line => {
        const colonIdx = line.indexOf(':');
        const eqIdx = line.indexOf('=');
        if (colonIdx > 0 && eqIdx > colonIdx) {
          const key = line.substring(0, colonIdx);
          if (key === name) {
            found = true;
            return `${name}:${type}=${value}`;
          }
        }
        return line;
      });

      if (!found) {
        updatedLines.push(`// Custom variable added by CMake GUI Configurator`);
        updatedLines.push(`${name}:${type}=${value}`);
      }

      fs.writeFileSync(cacheFilePath, updatedLines.join('\n'), 'utf8');
      return true;
    } catch (err) {
      console.error(`Error updating cache entry in ${cacheFilePath}:`, err);
      return false;
    }
  }
}

