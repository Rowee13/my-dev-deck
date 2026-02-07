'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Email {
  id: string;
  from: string;
  subject: string | null;
  receivedAt: string;
  isRead: boolean;
}

export default function ProjectInboxPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchEmails();
    }
  }, [projectId]);

  const fetchEmails = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/projects/${projectId}/emails`
      );
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading emails...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link
          href="/dashboard/devinbox"
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Project Inbox</h1>
      </div>

      {/* Email List */}
      {emails.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <span className="text-6xl mb-4 block">📬</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No emails yet
          </h3>
          <p className="text-gray-600 mb-6">
            Send an email to this project's address to see it appear here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {emails.map((email) => (
              <li
                key={email.id}
                className={`hover:bg-gray-50 transition-colors ${
                  !email.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {email.from}
                        </p>
                        {!email.isRead && (
                          <span className="flex-shrink-0 inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 truncate">
                        {email.subject || '(No subject)'}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <p className="text-sm text-gray-500">
                        {new Date(email.receivedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
