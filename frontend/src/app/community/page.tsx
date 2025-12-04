'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import CommunityPostForm from '@/components/CommunityPostForm';

interface Post {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  author: {
    id: string;
    name?: string;
    email: string;
  };
  upvotes: number;
  createdAt: string;
  comments?: Array<{
    id: string;
    content: string;
    author: {
      name?: string;
      email: string;
    };
    createdAt: string;
  }>;
}

export default function CommunityPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      loadPosts();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.getPosts() as Post[];
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.upvotePost(postId);
      loadPosts();
    } catch (error) {
      console.error('Failed to upvote:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Community</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
          >
            {showForm ? 'Cancel' : '+ New Post'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8">
            <CommunityPostForm
              onSuccess={() => {
                setShowForm(false);
                loadPosts();
              }}
            />
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-md p-6">
              <p className="text-sm sm:text-base text-gray-700 mb-4">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 text-gray-900 break-words">{post.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      by {post.author.name || post.author.email} •{' '}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpvote(post.id)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base whitespace-nowrap"
                  >
                    <span>👍</span>
                    <span className="font-medium">{post.upvotes || 0}</span>
                  </button>
                </div>

                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-48 sm:h-64 object-cover rounded-lg mb-4"
                  />
                )}

                <p className="text-sm sm:text-base text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed break-words">{post.body}</p>

                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">Comments</h4>
                    <div className="space-y-2">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">
                            <strong>{comment.author.name || comment.author.email}</strong> •{' '}
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm sm:text-base text-gray-700 break-words">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={`/community/posts/${post.id}`}
                  className="inline-block mt-4 text-sm sm:text-base text-pink-500 hover:text-pink-600 font-medium"
                >
                  View Details →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

