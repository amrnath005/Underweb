// src/security/source-tree-reconstructor.js
// Reconstructs original project directory hierarchies from exposed JavaScript source maps.
// Identifies sensitive source files (admin, configs, credentials) and generates ASCII file trees.

export class SourceTreeReconstructor {
  static SENSITIVE_PATTERNS = {
    DIRECTORIES: ['admin', 'internal', 'private', 'config', 'secrets', 'dashboard', 'billing', 'auth', 'env'],
    FILES: ['env', 'secret', 'firebase', 'aws', 'auth', 'stripe', 'jwt', 'token', 'credentials', 'database', 'db', 'password']
  };

  /**
   * Clean and normalize webpack / vite / turbopack source paths.
   * @param {string} rawPath
   * @returns {string}
   */
  static normalizePath(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return '';
    let p = rawPath.trim().replace(/\\/g, '/');

    // Remove protocol and bundling prefixes
    p = p.replace(/^webpack:\/\/[^/]*\/\.\//, '');
    p = p.replace(/^webpack:\/\/[^/]*\//, '');
    p = p.replace(/^webpack:\/\/\./, '');
    p = p.replace(/^webpack:\/\//, '');
    p = p.replace(/^vite:\/\/[^/]*\//, '');
    p = p.replace(/^\/@fs\//, '');
    p = p.replace(/^\/?node_modules\//, 'node_modules/');

    // Strip leading ./ or /
    p = p.replace(/^\.\//, '').replace(/^\/+/, '');

    // Resolve relative traversal artifacts like a/b/../c -> a/c
    const segments = p.split('/');
    const resolved = [];
    for (const seg of segments) {
      if (seg === '.' || seg === '') continue;
      if (seg === '..') {
        if (resolved.length > 0 && resolved[resolved.length - 1] !== '..') {
          resolved.pop();
        }
      } else {
        resolved.push(seg);
      }
    }

    return resolved.join('/');
  }

  /**
   * Determine if a file or directory path contains high-value sensitive targets.
   * @param {string} path
   * @returns {{ isSensitive: boolean, reason: string }}
   */
  static assessSensitivity(path) {
    const lower = path.toLowerCase();
    const parts = lower.split('/');
    const fileName = parts[parts.length - 1] || '';

    // Check filename first for specific targets
    for (const pattern of this.SENSITIVE_PATTERNS.FILES) {
      if (fileName.includes(pattern)) {
        return { isSensitive: true, reason: `Sensitive file keyword: ${pattern}` };
      }
    }

    // Check directory names
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      for (const pattern of this.SENSITIVE_PATTERNS.DIRECTORIES) {
        if (dir === pattern || dir.includes(pattern)) {
          return { isSensitive: true, reason: `Sensitive directory: ${parts[i]}` };
        }
      }
    }

    return { isSensitive: false, reason: '' };
  }

  /**
   * Reconstruct a hierarchical directory tree from an array of source file paths.
   * @param {Array<string>} sourcePaths
   * @param {object} [options={}]
   * @returns {object} { root, totalFiles, totalDirectories, sensitiveFiles, asciiTree }
   */
  static reconstruct(sourcePaths = [], options = {}) {
    const root = {
      name: 'root',
      path: '',
      type: 'directory',
      children: {}
    };

    let totalFiles = 0;
    let totalDirectories = 0;
    const sensitiveFiles = [];
    const seenPaths = new Set();

    for (const raw of sourcePaths) {
      const clean = this.normalizePath(raw);
      if (!clean || seenPaths.has(clean)) continue;
      seenPaths.add(clean);

      const segments = clean.split('/');
      let current = root;

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const isFile = i === segments.length - 1;
        const currentPath = segments.slice(0, i + 1).join('/');

        if (isFile) {
          totalFiles++;
          const sensitivity = this.assessSensitivity(currentPath);
          const fileNode = {
            name: seg,
            path: currentPath,
            type: 'file',
            extension: seg.includes('.') ? seg.split('.').pop() : '',
            isSensitive: sensitivity.isSensitive,
            sensitivityReason: sensitivity.reason
          };

          if (sensitivity.isSensitive) {
            sensitiveFiles.push(fileNode);
          }

          current.children[seg] = fileNode;
        } else {
          if (!current.children[seg]) {
            totalDirectories++;
            const dirSensitivity = this.assessSensitivity(currentPath);
            const dirNode = {
              name: seg,
              path: currentPath,
              type: 'directory',
              isSensitive: dirSensitivity.isSensitive,
              sensitivityReason: dirSensitivity.reason,
              children: {}
            };
            current.children[seg] = dirNode;
          }
          current = current.children[seg];
        }
      }
    }

    const asciiTree = this.renderAscii(root);

    return {
      root,
      totalFiles,
      totalDirectories,
      sensitiveFiles,
      asciiTree
    };
  }

  /**
   * Reconstruct tree from raw source map JSON object or string.
   * @param {string|object} mapData
   * @returns {object}
   */
  static reconstructFromSourceMap(mapData) {
    if (!mapData) return this.reconstruct([]);
    let parsed = mapData;
    if (typeof mapData === 'string') {
      try {
        parsed = JSON.parse(mapData);
      } catch {
        const lines = mapData.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
        return this.reconstruct(lines);
      }
    }
    const sources = Array.isArray(parsed) ? parsed : (parsed && parsed.sources ? parsed.sources : []);
    return this.reconstruct(sources);
  }

  /**
   * Render an ASCII visualization of the tree (compatible with standard `tree` output).
   * @param {object} node
   * @param {string} [prefix='']
   * @param {boolean} [isLast=true]
   * @param {boolean} [isRoot=true]
   * @returns {string}
   */
  static renderAscii(node, prefix = '', isLast = true, isRoot = true) {
    if (!node) return '';
    let out = '';

    if (!isRoot) {
      const branch = isLast ? '└── ' : '├── ';
      const sensitiveTag = node.isSensitive ? ` [!] ${node.sensitivityReason}` : '';
      out += `${prefix}${branch}${node.name}${node.type === 'directory' ? '/' : ''}${sensitiveTag}\n`;
    }

    if (node.type === 'directory' && node.children) {
      const childList = node.children instanceof Map ? Array.from(node.children.values()) : Object.values(node.children);
      // Sort directories first, then files alphabetically
      childList.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      const nextPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
      for (let i = 0; i < childList.length; i++) {
        const lastChild = i === childList.length - 1;
        out += this.renderAscii(childList[i], nextPrefix, lastChild, false);
      }
    }

    return out;
  }
}
