'use client';

import { useEffect, useState } from 'react';
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
      setError(err.response?.data?.message || 'Failed to fetch blogs');
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
      alert(err.response?.data?.message || 'Failed to upload image');
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
      alert(err.response?.data?.message || 'Failed to delete blog');
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
      alert(err.response?.data?.message || 'Failed to save blog');
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
            <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
            <p className="mt-1 text-sm text-gray-500">{blogs.length} post{blogs.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors"
          >
            + New Post
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-base font-medium">No posts yet</p>
            <p className="text-sm mt-1">Create your first blog post to get started.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div key={blog.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-0">
                    {/* Cover image */}
                    {blog.coverMediaId && (
                      <div className="flex-shrink-0 w-40 bg-gray-100">
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
                          <h3 className="text-base font-semibold text-gray-900 leading-snug flex-1">
                            {blog.title}
                          </h3>
                          <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            blog.status === 'published' ? 'bg-green-100 text-green-700' :
                            blog.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {blog.status}
                          </span>
                        </div>

                        {/* Summary / excerpt */}
                        {(blog.summary || blog.content) && (
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                            {blog.summary || blog.content!.replace(/<[^>]*>/g, '').substring(0, 160)}
                          </p>
                        )}
                      </div>

                      {/* Footer: meta + actions */}
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          {/* Date + slug */}
                          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                            <span>{formatDate(blog.createdAt)}</span>
                            <span className="font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded truncate max-w-xs">
                              /{blog.slug}
                            </span>
                          </div>
                          {/* Tags */}
                          {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {blog.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
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
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="text-sm font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
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
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages} &middot; {pagination.totalItems} posts
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter blog title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <p className="text-sm text-gray-500 py-1.5">
                    {editingBlog ? (
                      <code className="bg-gray-100 px-2 py-0.5 rounded">{editingBlog.slug}</code>
                    ) : (
                      'Auto-generated from title when you save.'
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary
                  </label>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter blog summary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    JPEG, PNG, GIF or WebP. Recommended aspect ratio 16:9 or 2:1 for best display on the blog.
                  </p>
                  <div className="space-y-2">
                    {coverPreviewUrl ? (
                      <div className="relative w-full">
                        {coverImageError ? (
                          <div className="flex items-center justify-center w-full h-36 rounded-md border border-gray-200 bg-gray-50 text-gray-400 text-sm">
                            Image unavailable
                          </div>
                        ) : (
                          <img
                            src={coverPreviewUrl}
                            alt="Cover preview"
                            className="max-h-56 w-full rounded-md border border-gray-200 object-cover object-center bg-gray-100"
                            onError={() => setCoverImageError(true)}
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveCover}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded shadow"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
                        <span className="text-sm text-gray-500">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter blog content (HTML supported)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g., guide, savings, beginners"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm"
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
