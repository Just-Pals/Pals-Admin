'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { blogAPI, mediaAPI, API_ORIGIN } from '@/lib/api';

interface Blog {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  coverMediaId?: string | null;
  coverImageUrl?: string | null;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    tags: '',
    coverMediaId: null as string | null,
    coverImageUrl: null as string | null,
  });
  const [coverUploading, setCoverUploading] = useState(false);
  /** Fallback to redirect URL if direct image URL fails to load */
  const [coverImageError, setCoverImageError] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogAPI.getAllBlogs({
        page: currentPage,
        perPage: 10,
      });

      if (response.data.success) {
        setBlogs(response.data.data?.blogs || []);
        setPagination(response.data.data?.pagination || response.data.meta?.pagination || null);
      } else {
        setError('Failed to fetch blogs');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch blogs');
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBlog(null);
    setCoverImageError(false);
    setFormData({
      title: '',
      summary: '',
      content: '',
      tags: '',
      coverMediaId: null,
      coverImageUrl: null,
    });
    setShowModal(true);
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setCoverImageError(false);
    // coverImageUrl is not persisted by the backend — resolve via coverMediaId instead
    const coverImageUrl = blog.coverMediaId
      ? `${API_ORIGIN}/api/media/public/${blog.coverMediaId}`
      : null;
    setFormData({
      title: blog.title,
      summary: blog.summary || '',
      content: blog.content || '',
      tags: blog.tags?.join(', ') || '',
      coverMediaId: blog.coverMediaId || null,
      coverImageUrl,
    });
    setShowModal(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, GIF, WebP)');
      return;
    }
    try {
      setCoverUploading(true);
      setCoverImageError(false);
      const res = await mediaAPI.uploadMedia(file, 'blog_cover');
      if (res.data?.success && res.data?.data?.media) {
        const { id, signedUrl, publicUrl } = res.data.data.media;
        setFormData((prev) => ({
          ...prev,
          coverMediaId: id,
          coverImageUrl: signedUrl || publicUrl || null,
        }));
      } else {
        alert('Upload failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveCover = () => {
    setCoverImageError(false);
    setFormData((prev) => ({
      ...prev,
      coverMediaId: null,
      coverImageUrl: null,
    }));
  };

  // Always prefer the stable public media URL when we have a coverMediaId.
  // Using coverImageUrl (signed, expiring) as primary caused edit-mode broken images
  // because the fallback was the same URL, so React never re-fetched.
  const coverPreviewUrl = formData.coverMediaId
    ? `${API_ORIGIN}/api/media/public/${formData.coverMediaId}`
    : formData.coverImageUrl || null;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      await blogAPI.deleteBlog(id);
      await fetchBlogs();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete blog');
      console.error('Error deleting blog:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const blogData = {
        title: formData.title,
        summary: formData.summary || undefined,
        content: formData.content,
        coverMediaId: formData.coverMediaId || undefined,
        // Don't send coverImageUrl — backend doesn't persist it and signed URLs expire
        status: 'published' as const,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      };

      if (editingBlog) {
        await blogAPI.updateBlog(editingBlog.id, blogData);
      } else {
        await blogAPI.createBlog(blogData);
      }

      setShowModal(false);
      await fetchBlogs();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save blog');
      console.error('Error saving blog:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Blog</h1>
            <p className="mt-1 text-sm text-white/50">{blogs.length} post{blogs.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-5 rounded-lg text-sm transition-colors"
          >
            + New Post
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-4"></div>
            <p className="text-sm">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm text-danger">{error}</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24 text-white/40">
            <p className="text-base font-medium">No posts yet</p>
            <p className="text-sm mt-1">Create your first blog post to get started.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div key={blog.id} className="bg-surface border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                  <div className="flex gap-0">
                    {/* Cover image */}
                    {blog.coverMediaId && (
                      <div className="flex-shrink-0 w-40 bg-white/5">
                        <img
                          src={blog.coverImageUrl || `${API_ORIGIN}/api/media/public/${blog.coverMediaId}`}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (blog.coverImageUrl && img.src !== `${API_ORIGIN}/api/media/public/${blog.coverMediaId}`) {
                              img.src = `${API_ORIGIN}/api/media/public/${blog.coverMediaId}`;
                            } else {
                              img.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Title + status */}
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-base font-semibold text-white leading-snug flex-1">
                            {blog.title}
                          </h3>
                          <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            blog.status === 'published' ? 'bg-success/15 text-success' :
                            blog.status === 'draft' ? 'bg-gold/15 text-gold' :
                            'bg-white/10 text-white/60'
                          }`}>
                            {blog.status}
                          </span>
                        </div>

                        {/* Summary / excerpt */}
                        {(blog.summary || blog.content) && (
                          <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
                            {blog.summary || blog.content!.replace(/<[^>]*>/g, '').substring(0, 160)}
                          </p>
                        )}
                      </div>

                      {/* Footer: meta + actions */}
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          {/* Date + slug */}
                          <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                            <span>{formatDate(blog.createdAt)}</span>
                            <span className="font-mono bg-white/10 text-white/50 px-1.5 py-0.5 rounded truncate max-w-xs">
                              /{blog.slug}
                            </span>
                          </div>
                          {/* Tags */}
                          {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {blog.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(blog)}
                            className="text-sm font-medium text-gold hover:text-gold-dark px-3 py-1.5 rounded-lg hover:bg-gold/10 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="text-sm font-medium text-danger hover:text-danger/80 px-3 py-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-white/50">
                  Page {pagination.page} of {pagination.totalPages} &middot; {pagination.totalItems} posts
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-1.5 border border-white/10 rounded-lg text-sm text-white/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-1.5 border border-white/10 rounded-lg text-sm text-white/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-white/10 w-full max-w-2xl shadow-lg rounded-md bg-surface">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/40 hover:text-white/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-gold text-white placeholder:text-white/40"
                    placeholder="Enter blog title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Slug
                  </label>
                  <p className="text-sm text-white/50 py-1.5">
                    {editingBlog ? (
                      <code className="bg-white/10 px-2 py-0.5 rounded">{editingBlog.slug}</code>
                    ) : (
                      'Auto-generated from title when you save.'
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Summary
                  </label>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-gold text-white placeholder:text-white/40"
                    placeholder="Enter blog summary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Cover Image
                  </label>
                  <p className="text-xs text-white/50 mb-2">
                    JPEG, PNG, GIF or WebP. Recommended aspect ratio 16:9 or 2:1 for best display on the blog.
                  </p>
                  <div className="space-y-2">
                    {coverPreviewUrl ? (
                      <div className="relative w-full">
                        {coverImageError ? (
                          <div className="flex items-center justify-center w-full h-36 rounded-md border border-white/10 bg-white/5 text-white/40 text-sm">
                            Image unavailable
                          </div>
                        ) : (
                          <img
                            src={coverPreviewUrl}
                            alt="Cover preview"
                            className="max-h-56 w-full rounded-md border border-white/10 object-cover object-center bg-white/5"
                            onError={() => setCoverImageError(true)}
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveCover}
                          className="absolute top-2 right-2 bg-danger/90 hover:bg-danger text-white text-xs px-2 py-1 rounded shadow"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-white/10 border-dashed rounded-md cursor-pointer hover:bg-white/5 hover:border-white/20 transition-colors">
                        <span className="text-sm text-white/50">
                          {coverUploading ? 'Uploading...' : 'Click to upload cover image'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleCoverUpload}
                          disabled={coverUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Content *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-gold text-white placeholder:text-white/40"
                    placeholder="Enter blog content (HTML supported)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-gold text-white placeholder:text-white/40"
                    placeholder="e.g., guide, savings, beginners"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
                  >
                    {editingBlog ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
