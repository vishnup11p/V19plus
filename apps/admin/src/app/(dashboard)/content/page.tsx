'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminContent as ContentItem } from '../../../api/admin';
import toast from 'react-hot-toast';
import {
  Film,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Check,
  X,
  Search,
  Loader2,
  FileVideo
} from 'lucide-react';

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  type: 'MOVIE',
  genre: 'Action',
  releaseYear: new Date().getFullYear(),
  rating: 'PG-13',
  imdbScore: '',
  duration: '',
  thumbnailUrl: '',
  backdropUrl: '',
  videoUrl: '',
  trailerUrl: '',
  isOriginal: false,
  isFeatured: false,
  isPublished: true,
  tags: '',
};

export default function AdminContent() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Video Upload States
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-content'],
    queryFn: async () => (await adminApi.listContent()).data,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        genre: form.genre.split(',').map((g) => g.trim()).filter(Boolean),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        imdbScore: form.imdbScore ? Number(form.imdbScore) : null,
        duration: form.duration ? Number(form.duration) : null,
        trailerUrl: form.trailerUrl || null,
        videoUrl: form.videoUrl || null,
      };
      return editing
        ? adminApi.updateContent(editing.id, payload as any)
        : adminApi.createContent(payload as any);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      
      const savedItem = res.data;
      const targetId = editing ? editing.id : savedItem?.id;

      if (selectedFile && targetId) {
        toast.success(editing ? 'Metadata updated. Starting video upload...' : 'Metadata created. Starting video upload...');
        uploadMutation.mutate({ contentId: targetId, file: selectedFile });
      } else {
        toast.success(editing ? 'Content updated successfully' : 'Content created successfully');
        resetForm();
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to save content';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast.success('Content deleted');
    },
    onError: () => toast.error('Failed to delete content'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ contentId, file }: { contentId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentId', contentId);
      return adminApi.uploadVideo(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast.success('Video uploaded & HLS transcoding initiated in background!');
      resetForm();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Video upload failed';
      toast.error(msg);
    },
  });

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(false);
    setUploadingId(null);
    setSelectedFile(null);
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
      imdbScore: item.imdbScore !== undefined && item.imdbScore !== null ? String(item.imdbScore) : '',
      duration: item.duration !== undefined && item.duration !== null ? String(item.duration) : '',
      thumbnailUrl: item.thumbnailUrl,
      backdropUrl: item.backdropUrl,
      videoUrl: item.videoUrl || '',
      trailerUrl: item.trailerUrl || '',
      isOriginal: item.isOriginal || false,
      isFeatured: item.isFeatured,
      isPublished: item.isPublished,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    });
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = (contentId: string) => {
    if (!selectedFile) {
      toast.error('Please select a video file first');
      return;
    }
    uploadMutation.mutate({ contentId, file: selectedFile });
  };

  // Filters items based on search and type select
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Content Manager</h1>
          <p className="text-gray-400">Add, edit, upload and transcode movies or serial titles.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-red-600/10 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Title
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="bg-[#141414] rounded-2xl p-6 border border-[#222] space-y-6 animate-slideDown"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#222]">
            <h2 className="font-semibold text-white text-lg">
              {editing ? `Edit: ${editing.title}` : 'Add New Title'}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Title"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
              required
            />
            <Input
              label="Slug (URL Path)"
              value={form.slug}
              onChange={(v) => setForm({ ...form, slug: v })}
              placeholder="auto-generated-from-title"
            />

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Description / Summary
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full bg-[#0f0f0f] border border-[#222] hover:border-[#333] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Content Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#222] hover:border-[#333] focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white outline-none cursor-pointer transition-colors"
              >
                <option value="MOVIE">Movie</option>
                <option value="SERIES">TV Series</option>
                <option value="DOCUMENTARY">Documentary</option>
              </select>
            </div>

            <Input
              label="Genres (comma-separated)"
              value={form.genre}
              onChange={(v) => setForm({ ...form, genre: v })}
              placeholder="Action, Sci-Fi, Adventure"
              required
            />

            <Input
              label="Release Year"
              value={String(form.releaseYear)}
              onChange={(v) => setForm({ ...form, releaseYear: Number(v) || new Date().getFullYear() })}
              required
            />

            <Input
              label="Maturity Rating"
              value={form.rating}
              onChange={(v) => setForm({ ...form, rating: v })}
              placeholder="PG-13, R, TV-MA"
              required
            />

            <Input
              label="IMDb Score (Optional)"
              value={form.imdbScore}
              onChange={(v) => setForm({ ...form, imdbScore: v })}
              placeholder="e.g. 8.2"
            />

            <Input
              label="Duration in Minutes (Optional)"
              value={form.duration}
              onChange={(v) => setForm({ ...form, duration: v })}
              placeholder="e.g. 142"
            />

            <div className="md:col-span-2">
              <Input
                label="Tags (comma-separated - Optional)"
                value={form.tags}
                onChange={(v) => setForm({ ...form, tags: v })}
                placeholder="e.g. blockbuster, space, mind-bending"
              />
            </div>

            <Input
              label="Poster Thumbnail URL"
              value={form.thumbnailUrl}
              onChange={(v) => setForm({ ...form, thumbnailUrl: v })}
              placeholder="https://domain.com/poster.jpg"
              required
            />

            <Input
              label="Backdrop Banner URL"
              value={form.backdropUrl}
              onChange={(v) => setForm({ ...form, backdropUrl: v })}
              placeholder="https://domain.com/backdrop.jpg"
              required
            />

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Video File Upload (Upload video and transcode automatically)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  id="form-file-upload"
                  className="hidden"
                />
                <label
                  htmlFor="form-file-upload"
                  className="flex items-center gap-2 px-4 py-3 bg-[#0f0f0f] border border-[#222] hover:border-[#333] rounded-xl text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
                >
                  <FileVideo className="w-5 h-5 shrink-0 text-red-500" />
                  <span className="truncate">
                    {selectedFile ? selectedFile.name : 'Choose raw video file...'}
                  </span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Direct Video URL (Optional if uploading file above)"
                value={form.videoUrl}
                onChange={(v) => setForm({ ...form, videoUrl: v })}
                placeholder="https://domain.com/hls/master.m3u8 (Optional if uploading file below)"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Trailer Video URL (Optional)"
                value={form.trailerUrl}
                onChange={(v) => setForm({ ...form, trailerUrl: v })}
                placeholder="https://domain.com/trailer.mp4"
              />
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 items-center md:col-span-2 py-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.isOriginal}
                  onChange={(e) => setForm({ ...form, isOriginal: e.target.checked })}
                  className="w-4.5 h-4.5 text-red-600 bg-[#0f0f0f] border-[#222] rounded focus:ring-red-500 focus:ring-offset-[#0f0f0f] focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  V19Plus Original Title
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="w-4.5 h-4.5 text-red-600 bg-[#0f0f0f] border-[#222] rounded focus:ring-red-500 focus:ring-offset-[#0f0f0f] focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Feature in homepage carousel (Featured)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4.5 h-4.5 text-red-600 bg-[#0f0f0f] border-[#222] rounded focus:ring-red-500 focus:ring-offset-[#0f0f0f] focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Publish to library catalog (Published)
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#222]">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Title' : 'Create Title'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-[#222] hover:bg-[#2a2a2a] text-gray-300 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#141414] border border-[#222] rounded-2xl p-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-[#222] hover:border-[#333] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white outline-none transition-all duration-200"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {['ALL', 'MOVIE', 'SERIES'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                filterType === type
                  ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/10'
                  : 'bg-[#0f0f0f] text-gray-400 border-[#222] hover:text-white hover:border-[#333]'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type === 'MOVIE' ? 'Movies' : 'TV Series'}
            </button>
          ))}
        </div>
      </div>

      {/* Library Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-40 bg-[#141414] border border-[#222] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-12 text-center text-gray-500">
          <Film className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="font-semibold text-white">No titles matching query</p>
          <p className="text-xs text-gray-500 mt-1">Try adapting your search keyword or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredItems.map((item) => {
            const isUploading = uploadingId === item.id;
            return (
              <div
                key={item.id}
                className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden hover:border-[#333] transition-all flex flex-col justify-between"
              >
                <div className="flex p-5 gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="w-20 h-28 object-cover rounded-xl border border-[#222] shadow-md shrink-0 bg-[#0f0f0f]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/1a1a1a/ffffff?text=Poster';
                    }}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-base truncate">{item.title}</h3>
                      <span className="bg-[#1a1a1a] text-gray-400 border border-[#2d2d2d] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.releaseYear} &bull; {item.rating} &bull; {Array.isArray(item.genre) ? item.genre.join(', ') : item.genre}
                      {item.duration ? ` &bull; ${item.duration} min` : ''}
                      {item.imdbScore ? ` &bull; ⭐ ${item.imdbScore}` : ''}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.2 rounded font-normal">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 line-clamp-2 pt-1 font-normal leading-relaxed">
                      {item.description}
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase ${
                          item.isPublished
                            ? 'text-emerald-400'
                            : 'text-gray-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isPublished ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {item.isFeatured && (
                        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                      {item.isOriginal && (
                        <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Original
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Action & Upload Form */}
                <div className="bg-[#1a1a1a] px-5 py-3 border-t border-[#222] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 truncate max-w-[60%]">
                      {item.videoUrl ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Check className="w-4.5 h-4.5" />
                          HLS Stream Linked
                        </span>
                      ) : (
                        <span className="text-yellow-500 font-medium">Video missing</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUploadingId(isUploading ? null : item.id);
                          setSelectedFile(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                          isUploading
                            ? 'bg-[#222] text-white border-[#333] hover:bg-[#2a2a2a]'
                            : 'bg-[#141414] text-gray-300 border-[#2d2d2d] hover:bg-[#222] hover:text-white'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this content?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Video Upload Field */}
                  {isUploading && (
                    <div className="pt-2 border-t border-[#2d2d2d] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <div className="flex-1 relative">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          id={`file-upload-${item.id}`}
                          className="hidden"
                        />
                        <label
                          htmlFor={`file-upload-${item.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] border border-[#2d2d2d] hover:border-[#333] rounded-xl text-xs text-gray-400 hover:text-white cursor-pointer transition-colors"
                        >
                          <FileVideo className="w-4 h-4 shrink-0 text-red-500" />
                          <span className="truncate">
                            {selectedFile ? selectedFile.name : 'Choose raw video file...'}
                          </span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUploadSubmit(item.id)}
                          disabled={!selectedFile || uploadMutation.isPending}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {uploadMutation.isPending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            'Start Upload'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setUploadingId(null);
                            setSelectedFile(null);
                          }}
                          className="px-3 py-2.5 bg-[#222] hover:bg-[#2a2a2a] text-gray-300 text-xs font-semibold rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-[#0f0f0f] border border-[#222] hover:border-[#333] focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200"
      />
    </div>
  );
}
