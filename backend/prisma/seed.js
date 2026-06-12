"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const BCRYPT_ROUNDS = 12;
const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_VIDEO_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const SAMPLE_VIDEO_3 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const thumb = (id) => `https://picsum.photos/seed/v19-${id}/400/600`;
const backdrop = (id) => `https://picsum.photos/seed/v19b-${id}/1920/1080`;
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
    await prisma.castMember.deleteMany();
    await prisma.episode.deleteMany();
    await prisma.season.deleteMany();
    await prisma.content.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();
    const adminHash = await bcryptjs_1.default.hash('Admin@123', BCRYPT_ROUNDS);
    const demoHash = await bcryptjs_1.default.hash('Demo@123', BCRYPT_ROUNDS);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@v19plus.com',
            passwordHash: adminHash,
            name: 'V19 Admin',
            isVerified: true,
            role: client_1.Role.ADMIN,
            profiles: { create: { name: 'Admin', avatarColor: '#FF6B1A' } },
        },
    });
    const demo = await prisma.user.create({
        data: {
            email: 'demo@v19plus.com',
            passwordHash: demoHash,
            name: 'Demo User',
            isVerified: true,
            role: client_1.Role.USER,
            profiles: {
                create: [
                    { name: 'Demo', avatarColor: '#FF6B1A' },
                    { name: 'Kids', avatarColor: '#4ECDC4', isKids: true },
                ],
            },
            subscription: {
                create: {
                    plan: client_1.SubscriptionPlan.PREMIUM,
                    status: client_1.SubscriptionStatus.ACTIVE,
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
    const contentRecords = [];
    let idx = 1;
    for (const m of movies) {
        const content = await prisma.content.create({
            data: {
                title: m.title,
                slug: m.slug,
                description: `${m.title} — A gripping ${m.genre[0].toLowerCase()} experience exclusive on V19+.`,
                type: client_1.ContentType.MOVIE,
                genre: m.genre,
                tags: m.tags,
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
                type: client_1.ContentType.SERIES,
                genre: s.genre,
                tags: s.tags,
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
                type: client_1.ContentType.DOCUMENTARY,
                genre: d.genre,
                tags: d.tags,
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
            data: { userId: demo.id, contentId: wh.contentId, progress: wh.progress, completed: false },
        });
    }
    for (const contentId of contentRecords.slice(0, 4).map((c) => c.id)) {
        await prisma.watchlist.create({ data: { userId: demo.id, contentId } });
    }
    for (const contentId of contentRecords.slice(0, 8).map((c) => c.id)) {
        await prisma.watchHistory.create({
            data: { userId: demo.id, contentId, progress: 100, completed: true },
        });
    }
    console.log('✅ Seed complete!');
    console.log(`   Admin: admin@v19plus.com / Admin@123`);
    console.log(`   Demo:  demo@v19plus.com / Demo@123`);
    console.log(`   Content: ${contentRecords.length} items`);
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map