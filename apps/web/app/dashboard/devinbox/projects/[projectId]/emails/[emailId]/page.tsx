'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../../../../lib/api';

interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: string;
  isRead: boolean;
  attachments: Attachment[];
}

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const emailId = params?.emailId as string;

  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [error, setError] = useState('');

  const markAsRead = useCallback(async (isRead: boolean) => {
    try {
      await apiRequest(
        `/api/projects/${projectId}/emails/${emailId}/read`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isRead }),
        }
      );
      if (email) {
        setEmail({ ...email, isRead });
      }
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }, [projectId, emailId, email]);

  const fetchEmail = useCallback(async () => {
    try {
      const res = await apiRequest(
        `/api/projects/${projectId}/emails/${emailId}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch email');
      }

      const data = await res.json();
      setEmail(data);

      // Mark as read if not already read
      if (!data.isRead) {
        markAsRead(true);
      }
    } catch (error) {
      console.error('Error fetching email:', error);
      setError('Failed to load email');
    } finally {
      setLoading(false);
    }
  }, [projectId, emailId, markAsRead]);

  useEffect(() => {
    if (projectId && emailId) {
      fetchEmail();
    }
  }, [projectId, emailId, fetchEmail]);

  const deleteEmail = async () => {
    if (!confirm('Are you sure you want to delete this email?')) {
      return;
    }

    try {
      const res = await apiRequest(
        `/api/projects/${projectId}/emails/${emailId}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to delete email');
      }

      router.push(`/dashboard/devinbox/projects/${projectId}`);
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Failed to delete email');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const downloadAttachment = (attachmentId: string, filename: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const url = `${apiUrl}/api/projects/${projectId}/emails/${emailId}/attachments/${attachmentId}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading email...</div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error || 'Email not found'}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href={`/dashboard/devinbox/projects/${projectId}`}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            ← Back to Inbox
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => markAsRead(!email.isRead)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Mark as {email.isRead ? 'Unread' : 'Read'}
          </button>
          <button
            onClick={deleteEmail}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Email Details */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Email Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {email.subject || '(No subject)'}
          </h1>

          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="font-medium text-gray-700 w-20">From:</span>
              <span className="text-gray-900">{email.from}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-20">To:</span>
              <span className="text-gray-900">{email.to.join(', ')}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-20">Date:</span>
              <span className="text-gray-900">
                {new Date(email.receivedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Attachments ({email.attachments.length})
            </h3>
            <div className="space-y-2">
              {email.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  onClick={() => downloadAttachment(attachment.id, attachment.filename)}
                  className="flex items-center justify-between w-full p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {attachment.filename}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatBytes(attachment.size)} • {attachment.contentType}
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div className="p-6">
          {/* View Mode Toggle */}
          {email.bodyHtml && email.bodyText && (
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setViewMode('html')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'html'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Plain Text
              </button>
            </div>
          )}

          {/* Email Content */}
          {viewMode === 'html' && email.bodyHtml ? (
            <div className="border border-gray-200 rounded-md p-4">
              <iframe
                srcDoc={email.bodyHtml}
                className="w-full min-h-96 border-0"
                sandbox="allow-same-origin"
                title="Email content"
              />
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900">
                {email.bodyText || 'No content'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
