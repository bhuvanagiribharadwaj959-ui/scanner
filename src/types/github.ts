export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  description?: string;
  stars?: number;
  forks?: number;
}

export interface TreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export interface TreeNode {
  path: string;
  name: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  children?: TreeNode[];
}

export interface GitCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer?: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author?: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
}

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
  loading?: boolean;
  error?: string;
}

export type SidebarTab = 'explorer' | 'search' | 'git';
