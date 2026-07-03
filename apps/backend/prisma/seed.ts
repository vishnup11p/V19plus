import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const toJsonArray = (val: any) => JSON.stringify(val);

const prisma = new PrismaClient();

const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_VIDEO_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const SAMPLE_VIDEO_3 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

const thumb = (id: number) => `https://picsum.photos/seed/v19-${id}/400/600`;
const backdrop = (id: number) => `https://picsum.photos/seed/v19b-${id}/1920/1080`;

const CAST_POOL = [
  ['Ryan Gosling', 'Emma Stone', 'John Legend', 'Rosemarie DeWitt'],
  ['Tom Hardy', 'Charlize Theron', 'Nicholas Hoult', 'Zoë Kravitz'],
  ['Zendaya', 'Timothée Chalamet', 'Oscar Isaac', 'Rebecca Ferguson'],
  ['Florence Pugh', 'Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'],
  ['Anya Taylor-Joy', 'Chris Hemsworth', 'Tessa Thompson', 'Idris Elba'],
];

async function main() {
  console.log('🌱 Seeding V19+ database...');

  await prisma.watchHistory.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.category.deleteMany();
  await prisma.castMember.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.season.deleteMany();
  await prisma.content.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@v19plus.com',
      passwordHash: adminPasswordHash,
      name: 'V19 Admin',
      isVerified: true,
      role: 'ADMIN',
      profiles: { create: { name: 'Admin', avatarColor: '#FF6B1A' } },
    },
  });

  const demo = await prisma.user.create({
    data: {
      email: 'demo@v19plus.com',
      googleId: 'seed-demo-v19plus',
      name: 'Demo User',
      isVerified: true,
      role: 'USER',
      profiles: {
        create: [
          { name: 'Demo', avatarColor: '#FF6B1A' },
          { name: 'Kids', avatarColor: '#4ECDC4', isKids: true },
        ],
      },
      subscription: {
        create: {
          plan: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const movies = [
    { title: 'Neon Horizon', slug: 'neon-horizon', genre: ['Action', 'Sci-Fi'], tags: ['blockbuster', 'futuristic'], rating: 'PG-13', imdbScore: 8.2, duration: 142, isFeatured: true, isOriginal: true },
    { title: 'The Last Letter', slug: 'the-last-letter', genre: ['Drama'], tags: ['emotional', 'award-winner'], rating: 'PG-13', imdbScore: 8.7, duration: 118 },
    { title: 'Quantum Drift', slug: 'quantum-drift', genre: ['Sci-Fi'], tags: ['space', 'mind-bending'], rating: 'PG-13', imdbScore: 7.9, duration: 156, isFeatured: true },
    { title: 'Midnight Caller', slug: 'midnight-caller', genre: ['Horror', 'Crime'], tags: ['thriller', 'dark'], rating: 'R', imdbScore: 7.4, duration: 98 },
    { title: 'City of Shadows', slug: 'city-of-shadows', genre: ['Crime', 'Drama'], tags: ['noir', 'detective'], rating: 'R', imdbScore: 8.1, duration: 134 },
  ];

  const series = [
    { title: 'Crimson Protocol', slug: 'crimson-protocol', genre: ['Action', 'Drama'], tags: ['espionage', 'original'], rating: 'TV-MA', imdbScore: 8.5, isOriginal: true },
    { title: 'Echoes of Tomorrow', slug: 'echoes-of-tomorrow', genre: ['Sci-Fi', 'Drama'], tags: ['time-travel'], rating: 'TV-14', imdbScore: 8.0 },
    { title: 'Harbor Lights', slug: 'harbor-lights', genre: ['Drama'], tags: ['family', 'coastal'], rating: 'TV-14', imdbScore: 7.8 },
    { title: 'Zero Day', slug: 'zero-day', genre: ['Crime', 'Action'], tags: ['hacker', 'cyber'], rating: 'TV-MA', imdbScore: 8.3, isOriginal: true },
  ];

  const documentaries = [
    { title: 'Oceans Unseen', slug: 'oceans-unseen', genre: ['Documentary'], tags: ['nature', 'ocean'], rating: 'G', imdbScore: 8.6, duration: 92 },
    { title: 'Rise of the Machines', slug: 'rise-of-the-machines', genre: ['Documentary'], tags: ['technology', 'AI'], rating: 'PG', imdbScore: 7.7, duration: 88 },
    { title: 'Voices of the Valley', slug: 'voices-of-the-valley', genre: ['Documentary'], tags: ['culture', 'music'], rating: 'PG', imdbScore: 8.0, duration: 76 },
  ];

  const contentRecords: { id: string; slug: string }[] = [];
  let idx = 1;

  for (const m of movies) {
    const content = await prisma.content.create({
      data: {
        title: m.title,
        slug: m.slug,
        description: `${m.title} — A gripping ${m.genre[0].toLowerCase()} experience exclusive on V19+.`,
        type: 'MOVIE',
        // @ts-ignore
        genre: toJsonArray(m.genre),
        tags: toJsonArray(m.tags),
        releaseYear: 2024 + (idx % 2),
        rating: m.rating,
        imdbScore: m.imdbScore,
        duration: m.duration,
        thumbnailUrl: thumb(idx),
        backdropUrl: backdrop(idx),
        videoUrl: idx % 3 === 0 ? SAMPLE_VIDEO_3 : idx % 2 === 0 ? SAMPLE_VIDEO_2 : SAMPLE_VIDEO,
        trailerUrl: SAMPLE_VIDEO,
        isOriginal: m.isOriginal || false,
        isFeatured: m.isFeatured || false,
        cast: {
          create: CAST_POOL[idx % CAST_POOL.length].map((name, i) => ({
            name,
            role: i === 0 ? 'Lead' : i === 1 ? 'Supporting' : 'Ensemble',
            photoUrl: `https://i.pravatar.cc/150?u=${name.replace(' ', '')}`,
          })),
        },
      },
    });
    contentRecords.push({ id: content.id, slug: content.slug });
    idx++;
  }

  for (const s of series) {
    const content = await prisma.content.create({
      data: {
        title: s.title,
        slug: s.slug,
        description: `${s.title} — An epic ${s.genre[0].toLowerCase()} series with twists at every turn.`,
        type: 'SERIES',
        // @ts-ignore
        genre: toJsonArray(s.genre),
        tags: toJsonArray(s.tags),
        releaseYear: 2023,
        rating: s.rating,
        imdbScore: s.imdbScore,
        thumbnailUrl: thumb(idx),
        backdropUrl: backdrop(idx),
        trailerUrl: SAMPLE_VIDEO,
        isOriginal: s.isOriginal || false,
        cast: {
          create: CAST_POOL[idx % CAST_POOL.length].map((name, i) => ({
            name,
            role: i === 0 ? 'Lead' : 'Supporting',
            photoUrl: `https://i.pravatar.cc/150?u=${name.replace(' ', '')}`,
          })),
        },
        seasons: {
          create: [1, 2].map((seasonNum) => ({
            number: seasonNum,
            title: `Season ${seasonNum}`,
            episodes: {
              create: Array.from({ length: 6 }, (_, ep) => ({
                number: ep + 1,
                title: `Episode ${ep + 1}`,
                description: `Season ${seasonNum}, Episode ${ep + 1} of ${s.title}`,
                duration: 45 + (ep * 2),
                thumbnailUrl: thumb(idx + ep),
                videoUrl: ep % 3 === 0 ? SAMPLE_VIDEO_3 : ep % 2 === 0 ? SAMPLE_VIDEO_2 : SAMPLE_VIDEO,
              })),
            },
          })),
        },
      },
    });
    contentRecords.push({ id: content.id, slug: content.slug });
    idx++;
  }

  for (const d of documentaries) {
    const content = await prisma.content.create({
      data: {
        title: d.title,
        slug: d.slug,
        description: `${d.title} — A stunning documentary journey.`,
        type: 'DOCUMENTARY',
        // @ts-ignore
        genre: toJsonArray(d.genre),
        tags: toJsonArray(d.tags),
        releaseYear: 2024,
        rating: d.rating,
        imdbScore: d.imdbScore,
        duration: d.duration,
        thumbnailUrl: thumb(idx),
        backdropUrl: backdrop(idx),
        videoUrl: SAMPLE_VIDEO,
        cast: {
          create: [
            { name: 'Narrator', role: 'Narrator', photoUrl: 'https://i.pravatar.cc/150?u=narrator' },
            { name: 'Director', role: 'Director', photoUrl: 'https://i.pravatar.cc/150?u=director' },
            { name: 'Producer', role: 'Producer', photoUrl: 'https://i.pravatar.cc/150?u=producer' },
          ],
        },
      },
    });
    contentRecords.push({ id: content.id, slug: content.slug });
    idx++;
  }

  const watchHistoryData = [
    { contentId: contentRecords[0].id, progress: 45 },
    { contentId: contentRecords[5].id, progress: 72 },
    { contentId: contentRecords[2].id, progress: 15 },
  ];

  for (const wh of watchHistoryData) {
    await prisma.watchHistory.create({
      data: {
        userId: demo.id,
        contentId: wh.contentId,
        entryKey: wh.contentId,
        progress: wh.progress,
        completed: false,
      },
    });
  }

  for (const contentId of contentRecords.slice(0, 4).map((c) => c.id)) {
    await prisma.watchlist.create({ data: { userId: demo.id, contentId } });
  }

  const inProgressIds = new Set(watchHistoryData.map((w) => w.contentId));
  for (const contentId of contentRecords.slice(0, 8).map((c) => c.id)) {
    if (inProgressIds.has(contentId)) continue;
    await prisma.watchHistory.create({
      data: { userId: demo.id, contentId, entryKey: contentId, progress: 100, completed: true },
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      siteName: 'V19+',
      tagline: 'Stream Unlimited',
      primaryColor: '#FF6B1A',
      footerText: '© 2026 V19+. All rights reserved.',
    },
    update: {},
  });

  const defaultCategories = [
    { name: 'Action', slug: 'action', icon: '💥', sortOrder: 1 },
    { name: 'Drama', slug: 'drama', icon: '🎭', sortOrder: 2 },
    { name: 'Sci-Fi', slug: 'sci-fi', icon: '🚀', sortOrder: 3 },
    { name: 'Horror', slug: 'horror', icon: '👻', sortOrder: 4 },
    { name: 'Crime', slug: 'crime', icon: '🔍', sortOrder: 5 },
    { name: 'Documentary', slug: 'documentary', icon: '📽️', sortOrder: 6 },
  ];
  for (const cat of defaultCategories) {
    await prisma.category.create({ data: cat });
  }

  console.log('✅ Seed complete!');
  console.log(`   Sign in with Google to access V19+`);
  console.log(`   Content: ${contentRecords.length} items`);
  console.log(`   Admin panel: /admin/login — admin@v19plus.com / ${adminPassword}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
