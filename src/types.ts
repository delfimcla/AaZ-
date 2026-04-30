export type ItemType = 'song' | 'album' | 'artist';

export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  type: ItemType;
  genre: string;
  coverUrl: string;
  averageRating: number;
  ratingCount: number;
}

export interface UserRating {
  id: string;
  userId: string;
  itemId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
}
