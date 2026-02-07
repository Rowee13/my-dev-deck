'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProjectTabsProps {
  projectId: string;
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname();

  const isInbox = pathname === `/dashboard/devinbox/projects/${projectId}`;
  const isSettings = pathname === `/dashboard/devinbox/projects/${projectId}/settings`;

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <Link
          href={`/dashboard/devinbox/projects/${projectId}`}
          className={`
            py-4 px-1 border-b-2 font-medium text-sm transition-colors
            ${
              isInbox
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          📬 Inbox
        </Link>
        <Link
          href={`/dashboard/devinbox/projects/${projectId}/settings`}
          className={`
            py-4 px-1 border-b-2 font-medium text-sm transition-colors
            ${
              isSettings
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          ⚙️ Settings
        </Link>
      </nav>
    </div>
  );
}
