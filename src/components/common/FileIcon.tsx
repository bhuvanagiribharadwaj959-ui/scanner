import React from 'react';
import {
  FileCode,
  FileText,
  FileJson,
  Folder,
  FolderOpen,
  Code,
  File,
  Terminal,
  Settings,
} from 'lucide-react';

interface FileIconProps {
  name: string;
  isFolder?: boolean;
  isOpen?: boolean;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({
  name,
  isFolder = false,
  isOpen = false,
  size = 16,
}) => {
  if (isFolder) {
    return isOpen ? (
      <FolderOpen size={size} color="#e5ba48" style={{ minWidth: size }} />
    ) : (
      <Folder size={size} color="#e5ba48" style={{ minWidth: size }} />
    );
  }

  const ext = name.split('.').pop()?.toLowerCase() || '';
  const lowerName = name.toLowerCase();

  if (lowerName === 'package.json') {
    return <FileJson size={size} color="#cb3837" style={{ minWidth: size }} />;
  }
  if (lowerName.includes('config') || lowerName.startsWith('.')) {
    return <Settings size={size} color="#969696" style={{ minWidth: size }} />;
  }

  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={size} color="#3178c6" style={{ minWidth: size }} />;
    case 'js':
    case 'jsx':
    case 'mjs':
      return <FileCode size={size} color="#f7df1e" style={{ minWidth: size }} />;
    case 'json':
      return <FileJson size={size} color="#f7c843" style={{ minWidth: size }} />;
    case 'py':
      return <Code size={size} color="#3572A5" style={{ minWidth: size }} />;
    case 'html':
      return <Code size={size} color="#e34c26" style={{ minWidth: size }} />;
    case 'css':
    case 'scss':
    case 'less':
      return <Code size={size} color="#563d7c" style={{ minWidth: size }} />;
    case 'md':
    case 'markdown':
      return <FileText size={size} color="#0284c7" style={{ minWidth: size }} />;
    case 'sh':
    case 'bash':
      return <Terminal size={size} color="#16a34a" style={{ minWidth: size }} />;
    case 'rs':
      return <Code size={size} color="#ea580c" style={{ minWidth: size }} />;
    case 'go':
      return <Code size={size} color="#0284c7" style={{ minWidth: size }} />;
    case 'java':
      return <Code size={size} color="#b45309" style={{ minWidth: size }} />;
    default:
      return <File size={size} color="#94a3b8" style={{ minWidth: size }} />;
  }
};
