import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import toast from 'react-hot-toast';

export function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await adminApi.getSettings()).data,
  });

  const [form, setForm] = useState({
    siteName: '',
    tagline: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#FF6B1A',
    footerText: '',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings.siteName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        primaryColor: settings.primaryColor,
        footerText: settings.footerText,
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        siteName: form.siteName,
        tagline: form.tagline,
        logoUrl: form.logoUrl || null,
        faviconUrl: form.faviconUrl || null,
        primaryColor: form.primaryColor,
        footerText: form.footerText,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) return <p className="text-v-muted">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Site Settings</h1>
      <p className="text-v-muted mb-8">Manage branding, logo, and site appearance</p>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="space-y-5"
      >
        <Field label="Site Name" value={form.siteName} onChange={(v) => setForm({ ...form, siteName: v })} />
        <Field label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
        <Field label="Logo URL" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} placeholder="https://..." />
        <Field label="Favicon URL" value={form.faviconUrl} onChange={(v) => setForm({ ...form, faviconUrl: v })} placeholder="https://..." />
        <div>
          <label className="block text-sm text-v-muted mb-1">Primary Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="flex-1 bg-v-raised border border-v-divider rounded-lg px-4 py-2 text-v-text"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-v-muted mb-1">Footer Text</label>
          <textarea
            value={form.footerText}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
            rows={2}
            className="w-full bg-v-raised border border-v-divider rounded-lg px-4 py-2 text-v-text resize-none"
          />
        </div>

        {form.logoUrl && (
          <div className="p-4 bg-v-raised rounded-lg border border-v-divider">
            <p className="text-xs text-v-muted mb-2">Logo Preview</p>
            <img src={form.logoUrl} alt="Logo preview" className="h-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-2.5 bg-v-orange hover:bg-v-orange-light text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-v-muted mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-v-raised border border-v-divider rounded-lg px-4 py-2 text-v-text"
      />
    </div>
  );
}
