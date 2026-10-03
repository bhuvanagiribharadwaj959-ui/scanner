import React, { useState, useMemo } from 'react';
import { Search, FileCode, X } from 'lucide-react';
import { FileIcon } from '@/components/common/FileIcon';

interface SearchViewProps {
  flatFiles: Array<{ path: string; type: string; size?: number }>;
  onSelectFile: (path: string) => void;
  activeFilePath: string | null;
}

export const SearchView: React.FC<SearchViewProps> = ({
  flatFiles,
  onSelectFile,
  activeFilePath,
}) => {
  const [query, setQuery] = useState('');

  const blobFiles = useMemo(() => {
    return flatFiles.filter((f) => f.type === 'blob');
  }, [flatFiles]);

  const filteredFiles = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return blobFiles
      .filter((file) => file.path.toLowerCase().includes(q))
      .slice(0, 100); // Top 100 results
  }, [blobFiles, query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px 8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '6px 10px',
          marginBottom: 10,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <Search size={14} color="#94a3b8" style={{ marginRight: 8, flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files by name or path..."
          style={{ flex: 1, fontSize: 12, color: '#0f172a', background: 'transparent', outline: 'none' }}
          autoFocus
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ opacity: 0.7, color: '#64748b' }}>
            <X size={13} />
          </button>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#888888', marginBottom: 8, paddingLeft: 4 }}>
        {query.trim() ? (
          <span>
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'} found
            {filteredFiles.length >= 100 ? ' (showing first 100)' : ''}
          </span>
        ) : (
          <span>Search in {blobFiles.length} repository files</span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {query.trim() && filteredFiles.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#777777', fontSize: 12 }}>
            No matching files found for &quot;{query}&quot;
          </div>
        ) : (
          filteredFiles.map((file) => {
            const fileName = file.path.split('/').pop() || file.path;
            const dirName = file.path.split('/').slice(0, -1).join('/');
            const isActive = activeFilePath === file.path;

            return (
              <div
                key={file.path}
                className={`tree-item-row ${isActive ? 'active' : ''}`}
                onClick={() => onSelectFile(file.path)}
                style={{ padding: '6px 8px', borderRadius: 4, marginBottom: 2 }}
                title={file.path}
              >
                <div className="file-icon">
                  <FileIcon name={fileName} size={15} />
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 500, color: '#e0e0e0', marginRight: 6 }}>{fileName}</span>
                  {dirName && (
                    <span style={{ fontSize: 11, color: '#777777' }}>{dirName}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
