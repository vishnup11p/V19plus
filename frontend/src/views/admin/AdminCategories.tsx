import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import type { Category } from '../../api/settings';
import toast from 'react-hot-toast';

export function AdminCategories() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🎬', sortOrder: 0, isActive: true });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => (await adminApi.listCategories()).data,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateCategory(editing.id, form)
        : adminApi.createCategory(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(editing ? 'Category updated' : 'Category created');
      resetForm();
    },
    onError: () => toast.error('Failed to save category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Failed to delete category'),
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', icon: '🎬', sortOrder: 0, isActive: true });
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder, isActive: cat.isActive });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Categories</h1>
      <p className="text-v-muted mb-8">Manage browse genres shown in the app</p>

      <div className="grid lg:grid-cols-2 gap-8">
        <form
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="bg-v-raised rounded-xl p-6 border border-v-divider space-y-4"
        >
          <h2 className="font-semibold">{editing ? 'Edit Category' : 'Add Category'}</h2>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-v-black border border-v-divider rounded-lg px-4 py-2"
            required
          />
          <input
            type="text"
            placeholder="Icon (emoji)"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-full bg-v-black border border-v-divider rounded-lg px-4 py-2"
          />
          <input
            type="number"
            placeholder="Sort order"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="w-full bg-v-black border border-v-divider rounded-lg px-4 py-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-v-orange text-white rounded-lg text-sm">
              {editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-v-divider text-v-text rounded-lg text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-v-muted">Loading...</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between bg-v-raised rounded-lg px-4 py-3 border border-v-divider">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-v-muted">Order: {cat.sortOrder} · {cat.isActive ? 'Active' : 'Hidden'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(cat)} className="text-sm text-v-orange hover:underline">Edit</button>
                  <button onClick={() => deleteMutation.mutate(cat.id)} className="text-sm text-red-400 hover:underline">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
