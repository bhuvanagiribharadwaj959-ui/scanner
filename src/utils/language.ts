export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const fileName = filePath.split('/').pop()?.toLowerCase() || '';

  if (fileName === 'dockerfile') return 'dockerfile';
  if (fileName === 'makefile') return 'makefile';
  if (fileName.startsWith('.env')) return 'ini';

  switch (ext) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'json':
      return 'json';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'less':
      return 'less';
    case 'py':
      return 'python';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
    case 'svg':
      return 'xml';
    case 'sql':
      return 'sql';
    case 'graphql':
    case 'gql':
      return 'graphql';
    case 'lua':
      return 'lua';
    case 'dart':
      return 'dart';
    case 'swift':
      return 'swift';
    case 'kt':
    case 'kts':
      return 'kotlin';
    default:
      return 'plaintext';
  }
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
}

export function parseGitHubUrl(input: string): ParsedGitHubUrl | null {
  if (!input || !input.trim()) return null;
  let clean = input.trim();

  // Remove trailing slashes and .git
  clean = clean.replace(/\.git\/?$/, '');

  // Remove protocol
  clean = clean.replace(/^https?:\/\//, '');

  // Remove github.com/
  clean = clean.replace(/^github\.com\//, '');

  const parts = clean.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1];

  let branch: string | undefined;
  let path: string | undefined;

  if (parts.length >= 4 && (parts[2] === 'tree' || parts[2] === 'blob')) {
    branch = parts[3];
    if (parts.length > 4) {
      path = parts.slice(4).join('/');
    }
  }

  return { owner, repo, branch, path };
}

export function buildTreeFromItems(items: Array<{ path: string; type: 'blob' | 'tree'; sha: string; size?: number }>) {
  const root: { [key: string]: any } = {};

  for (const item of items) {
    const parts = item.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current[part]) {
        current[part] = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isLast ? item.type : 'tree',
          sha: isLast ? item.sha : '',
          size: isLast ? item.size : undefined,
          children: {},
        };
      }
      current = current[part].children;
    }
  }

  function convertToNodes(obj: { [key: string]: any }): any[] {
    const nodes = Object.values(obj).map((entry: any) => {
      const node: any = {
        name: entry.name,
        path: entry.path,
        type: entry.type,
        sha: entry.sha,
        size: entry.size,
      };
      if (entry.children && Object.keys(entry.children).length > 0) {
        node.children = convertToNodes(entry.children);
      }
      return node;
    });

    // Sort: directories first, then alphabetical
    nodes.sort((a, b) => {
      if (a.type === 'tree' && b.type !== 'tree') return -1;
      if (a.type !== 'tree' && b.type === 'tree') return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return nodes;
  }

  return convertToNodes(root);
}
