import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { RedisService } from '../redis/redis.service';

interface ListQuery {
  type?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ContentService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly redis: RedisService,
  ) {}

  private mapContent(c: any) {
    if (!c) return null;
    return {
      ...c,
      genre: c.genres || c.genre || [],
      genres: undefined,
    };
  }

  private mapContentList(items: any[]) {
    return items.map((item) => this.mapContent(item));
  }

  async listContent(query: ListQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    let col = this.firebase.firestore.collection('content').where('isPublished', '==', true);
    if (query.type) {
      col = col.where('type', '==', query.type);
    }
    if (query.genre) {
      col = col.where('genres', 'array-contains', query.genre.toLowerCase());
    }
    
    const snap = await col.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Sort in memory by createdAt desc
    items.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    const total = items.length;
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return {
      items: this.mapContentList(paginatedItems),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeatured() {
    const cacheKey = 'content:featured';
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const snap = await this.firebase.firestore.collection('content')
      .where('isPublished', '==', true)
      .where('isFeatured', '==', true)
      .limit(5)
      .get();
      
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const mapped = this.mapContentList(items);
    await this.redis.set(cacheKey, mapped, 1800);
    return mapped;
  }

  async getTrending() {
    const cacheKey = 'content:trending';
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    // Fetch and sort in memory to bypass composite index constraints
    const snap = await this.firebase.firestore.collection('content')
      .where('isPublished', '==', true)
      .get();

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a: any, b: any) => (b.imdbScore || 0) - (a.imdbScore || 0));

    const trendingItems = items.slice(0, 10);
    const mapped = this.mapContentList(trendingItems);
    await this.redis.set(cacheKey, mapped, 600);
    return mapped;
  }

  async getOriginals() {
    const snap = await this.firebase.firestore.collection('content')
      .where('isPublished', '==', true)
      .where('isOriginal', '==', true)
      .get();
      
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in memory by createdAt desc
    items.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return this.mapContentList(items);
  }

  async getContinueWatching(userId: string) {
    const snap = await this.firebase.firestore.collection('watchHistory')
      .where('userId', '==', userId)
      .where('completed', '==', false)
      .get();
      
    let history = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    // Filter and sort in memory
    history = history.filter(h => h.progress > 0);
    history.sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0));
    
    const limitedHistory = history.slice(0, 10);
    
    // Fetch content manually
    for (let h of limitedHistory) {
      if (h.contentId) {
        const c = await this.firebase.firestore.collection('content').doc(h.contentId).get();
        if (c.exists) h.content = { id: c.id, ...c.data() };
      }
    }

    return limitedHistory.map((h) => ({
      ...h,
      content: this.mapContent(h.content),
    }));
  }

  async getRecommended(userId: string) {
    // Basic recommendation - Fetch and sort in memory
    const snap = await this.firebase.firestore.collection('content')
      .where('isPublished', '==', true)
      .get();
      
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a: any, b: any) => (b.imdbScore || 0) - (a.imdbScore || 0));

    const recommendedItems = items.slice(0, 20);
    return this.mapContentList(recommendedItems);
  }

  async getBySlug(slug: string, userId?: string) {
    const snap = await this.firebase.firestore.collection('content').where('slug', '==', slug).limit(1).get();
    if (snap.empty) throw new NotFoundException('Content not found');
    
    const content = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
    if (!content.isPublished) throw new NotFoundException('Content not found');

    let watchProgress: any = null;
    if (userId) {
      const histSnap = await this.firebase.firestore.collection('watchHistory')
        .where('userId', '==', userId)
        .where('contentId', '==', content.id)
        .limit(1).get();
        
      if (!histSnap.empty) {
        const history = histSnap.docs[0].data();
        watchProgress = {
          progress: history.progress,
          completed: history.completed,
          episodeId: history.episodeId,
        };
      }
    }

    return { ...this.mapContent(content), watchProgress };
  }

  async getEpisodes(contentId: string) {
    const doc = await this.firebase.firestore.collection('content').doc(contentId).get();
    if (!doc.exists) throw new NotFoundException('Content not found');
    return doc.data()?.seasons || [];
  }

  async listCategories() {
    const snap = await this.firebase.firestore.collection('categories').where('isActive', '==', true).get();
    const categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return categories.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getWatchlist(userId: string) {
    const snap = await this.firebase.firestore.collection('watchlist').where('userId', '==', userId).get();
    const watchlist = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    // Sort in memory by addedAt desc
    watchlist.sort((a: any, b: any) => {
      const timeA = a.addedAt?.toDate ? a.addedAt.toDate().getTime() : (a.addedAt ? new Date(a.addedAt).getTime() : 0);
      const timeB = b.addedAt?.toDate ? b.addedAt.toDate().getTime() : (b.addedAt ? new Date(b.addedAt).getTime() : 0);
      return timeB - timeA;
    });
    
    for (let w of watchlist) {
      if (w.contentId) {
        const c = await this.firebase.firestore.collection('content').doc(w.contentId).get();
        if (c.exists) w.content = { id: c.id, ...c.data() };
      }
    }
    
    return watchlist.map((w) => ({
      ...w,
      content: this.mapContent(w.content),
    }));
  }

  async addToWatchlist(userId: string, contentId: string) {
    const docRef = this.firebase.firestore.collection('watchlist').doc(`${userId}_${contentId}`);
    const doc = await docRef.get();
    if (doc.exists) return doc.data();

    const data = { userId, contentId, addedAt: new Date() };
    await docRef.set(data);
    return data;
  }

  async removeFromWatchlist(userId: string, contentId: string) {
    const docRef = this.firebase.firestore.collection('watchlist').doc(`${userId}_${contentId}`);
    await docRef.delete();
    return { message: 'Removed from watchlist' };
  }

  async createContent(data: any) {
    const payload = { ...data, createdAt: new Date() };
    const docRef = this.firebase.firestore.collection('content').doc();
    payload.id = docRef.id;
    await docRef.set(payload);

    await this.redis.del('content:featured');
    await this.redis.del('content:trending');
    return this.mapContent(payload);
  }

  async updateContent(id: string, data: any) {
    const docRef = this.firebase.firestore.collection('content').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new NotFoundException('Content not found');

    await docRef.update(data);
    const updated = await docRef.get();

    await this.redis.del('content:featured');
    await this.redis.del('content:trending');
    return this.mapContent({ id: updated.id, ...updated.data() });
  }

  async deleteContent(id: string) {
    const docRef = this.firebase.firestore.collection('content').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new NotFoundException('Content not found');

    await docRef.delete();
    await this.redis.del('content:featured');
    await this.redis.del('content:trending');
    return { message: 'Content deleted' };
  }
}

