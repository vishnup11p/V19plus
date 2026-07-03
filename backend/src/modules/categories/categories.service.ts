import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function listPublic() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function listAll() {
  return prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function create(data: { name: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
  const slug = slugify(data.name);
  const existing = await prisma.category.findFirst({ where: { OR: [{ name: data.name }, { slug }] } });
  if (existing) throw new AppError('Category already exists', 409);

  return prisma.category.create({
    data: { name: data.name, slug, icon: data.icon || '🎬', sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true },
  });
}

export async function update(id: string, data: { name?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new AppError('Category not found', 404);

  const updateData: any = { ...data };
  if (data.name) updateData.slug = slugify(data.name);

  return prisma.category.update({ where: { id }, data: updateData });
}

export async function remove(id: string) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new AppError('Category not found', 404);
  await prisma.category.delete({ where: { id } });
  return { message: 'Category deleted' };
}
