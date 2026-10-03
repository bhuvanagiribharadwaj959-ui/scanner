import React, { useState, useEffect } from 'react';
import { GitCommit, Loader2, ExternalLink, Calendar, User, Search } from 'lucide-react';
import { GitCommit as GitCommitType } from '@/types/github';

interface GitHistoryViewProps {
  owner: string;
  repo: string;
  branch: string;
}

export const GitHistoryView: React.FC<GitHistoryViewProps> = ({
  owner,
  repo,
  branch,
}) => {
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!owner || !repo) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/github/commits?owner=${owner}&repo=${repo}&branch=${branch}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load commits');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setCommits(data.commits || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error loading commit history');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [owner, repo, branch]);

  const filteredCommits = commits.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const msg = c.commit.message.toLowerCase();
    const author = (c.commit.author.name || '').toLowerCase();
    const sha = c.sha.toLowerCase();
    return msg.includes(q) || author.includes(q) || sha.includes(q);
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '5px 10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <Search size={13} color="#94a3b8" style={{ marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter commits by message, author, or SHA..."
            style={{ flex: 1, fontSize: 11.5, color: '#0f172a', background: 'transparent', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, color: '#888888', fontSize: 12 }}>
            <Loader2 size={16} className="animate-spin" color="#007acc" />
            <span>Fetching commit history...</span>
          </div>
        )}

        {error && (
          <div style={{ padding: 16, color: '#f14c4c', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!isLoading && !error && filteredCommits.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: '#777777', fontSize: 12 }}>
            No commits found.
          </div>
        )}

        {!isLoading &&
          filteredCommits.map((c) => {
            const shortSha = c.sha.substring(0, 7);
            const firstLine = c.commit.message.split('\n')[0];
            const authorName = c.commit.author.name || 'Unknown';
            const dateStr = formatDate(c.commit.author.date);

            return (
              <div
                key={c.sha}
                className="commit-item"
                title={`${firstLine}\n\nAuthor: ${authorName}\nDate: ${c.commit.author.date}\nSHA: ${c.sha}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div className="commit-message" style={{ flex: 1 }}>
                    {firstLine}
                  </div>
                  <a
                    href={c.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#858585', padding: 2 }}
                    title="View commit on GitHub"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="commit-meta" style={{ marginTop: 4 }}>
                  <div className="commit-author">
                    {c.author?.avatar_url ? (
                      <img
                        src={c.author.avatar_url}
                        alt={authorName}
                        className="commit-avatar"
                      />
                    ) : (
                      <User size={14} color="#888888" />
                    )}
                    <span>{authorName}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{dateStr}</span>
                    <span className="commit-sha-badge">{shortSha}</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
