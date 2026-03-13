export interface PostImage {
  url: string;
  width: number;
  height: number;
}

export interface PostRecord {
  id: string;
  authorId: string;
  content: string;
  images: PostImage[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface PostListItem extends PostRecord {
  excerpt: string;
}
