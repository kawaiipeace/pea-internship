import { api } from "./client";
import type { Position } from "./position";

export interface FavoriteItem {
  favorite: {
    id: number;
    userId: string;
    positionId: number;
    createdAt: string;
    updatedAt: string;
  };
  position: Position;
}

export interface FavoritesResponse {
  data: FavoriteItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export const favoriteApi = {
  // ดึงรายการ favorite ของตัวเอง
  getFavorites: async (page = 1, limit = 100): Promise<FavoritesResponse> => {
    try {
      const response = await api.get<FavoritesResponse>(`/favorite?page=${page}&limit=${limit}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0, hasNextPage: false } };
    }
  },

  // กด favorite ตำแหน่ง
  addFavorite: async (positionId: number): Promise<{ id: number; userId: string; positionId: number } | null> => {
    try {
      const response = await api.post("/favorite", { positionId });
      return response.data;
    } catch {
      return null;
    }
  },

  // ลบ favorite ตาม positionId
  removeFavorite: async (positionId: number): Promise<boolean> => {
    try {
      await api.delete(`/favorite/${positionId}`);
      return true;
    } catch {
      return false;
    }
  },
};
