import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminContent as ContentItem } from '../../api/admin';
import toast from 'react-hot-toast';

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  type: 'MOVIE',
  genre: 'Action',
  releaseYear: new Date().getFullYear(),
  rating: 'PG-13',
  thumbnailUrl: '',
  backdropUrl: '',
  videoUrl: '',
  isFeatured: false,
  isPublished: true,
};

export function AdminContent() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-content'],
    queryFn: async () => (await adminApi.listContent()).data,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        genre: form.genre.split(',').map((g) => g.trim()).filter(Boolean),
        tags: [],
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
      return editing
        ? adminApi.updateContent(editing.id, payload)
        : adminApi.createContent(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast.success(editing ? 'Content updated' : 'Content created');
      resetForm();
    },
    onError: () => toast.error('Failed to save content'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast.success('Content deleted');
    },
    onError: () => toast.error('Failed to delete content'),
  });

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (item: ContentItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description,
      type: item.type,
      genre: Array.isArray(item.genre) ? item.genre.join(', ') : String(item.genre),
      releaseYear: item.releaseYear,
      rating: item.rating,
      thumbnailUrl: item.thumbnailUrl,
      backdropUrl: item.backdropUrl,
      videoUrl: item.videoUrl || '',
      isFeatured: item.isFeatured,
      isPublished: item.isPublished,
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Content</h1>
          <p className="text-v-muted">Manage movies and series</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-v-orange text-white rounded-lg text-sm"
        >
          + Add Content
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="bg-v-raised rounded-xl p-6 border border-v-divider mb-8 grid md:grid-cols-2 gap-4"
        >
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Input label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="auto-generated" />
          <div className="md:col-span-2">
            <label className="text-sm text-v-muted">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full mt-1 bg-v-black border border-v-divider rounded-lg px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="text-sm text-v-muted">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full mt-1 bg-v-black border border-v-divider rounded-lg px-4 py-2"
            >
              <option value="MOVIE">Movie</option>
              <option value="SERIES">Series</option>
            </select>
          </div>
          <Input label="Genres (comma-separated)" value={form.genre} onChange={(v) => setForm({ ...form, genre: v })} />
          <Input label="Release Year" value={String(form.releaseYear)} onChange={(v) => setForm({ ...form, releaseYear: Number(v) })} />
          <Input label="Rating" value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          <Input label="Thumbnail URL" value={form.thumbnailUrl} onChange={(v) => setForm({ ...form, thumbnailUrl: v })} />
          <Input label="Backdrop URL" value={form.backdropUrl} onChange={(v) => setForm({ ...form, backdropUrl: v })} />
          <Input label="Video URL" value={form.videoUrl} onChange={(v) => setForm({ ...form, videoUrl: v })} />
          <div className="flex gap-4 items-center md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              Published
            </label>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-v-orange text-white rounded-lg text-sm">
              {editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 bg-v-divider rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-v-muted">Loading...</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-v-raised rounded-lg p-4 border border-v-divider">
              <img src={item.thumbnailUrl} alt="" className="w-12 h-16 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-xs text-v-muted">{item.type} · {item.releaseYear} · {item.isPublished ? 'Published' : 'Draft'}</p>
              </div>
              <button onClick={() => startEdit(item)} className="text-sm text-v-orange">Edit</button>
              <button onClick={() => deleteMutation.mutate(item.id)} className="text-sm text-red-400">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm text-v-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full mt-1 bg-v-black border border-v-divider rounded-lg px-4 py-2"
      />
    </div>
  );
}
