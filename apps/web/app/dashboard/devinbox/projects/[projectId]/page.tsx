"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProjectTabs } from "../../../../../components/devinbox/ProjectTabs";

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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEmails, setTotalEmails] = useState(0);
    const itemsPerPage = 20;

    useEffect(() => {
        if (projectId) {
            fetchEmails();

            // Auto-refresh every 10 seconds
            const interval = setInterval(() => {
                fetchEmails(true); // Silent refresh
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [projectId, currentPage]);

    const fetchEmails = async (silent = false) => {
        try {
            if (silent) {
                setIsRefreshing(true);
            }

            const offset = (currentPage - 1) * itemsPerPage;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
            const res = await fetch(
                `${apiUrl}/api/projects/${projectId}/emails?limit=${itemsPerPage}&offset=${offset}`
            );
            const data = await res.json();
            setEmails(data.emails || []);
            setTotalEmails(data.total || 0);
        } catch (error) {
            console.error("Error fetching emails:", error);
        } finally {
            setLoading(false);
            if (silent) {
                setIsRefreshing(false);
            }
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
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link href="/dashboard/devinbox" className="mr-4 text-gray-600 hover:text-gray-900">
                        ← Back
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Project Inbox</h1>
                </div>
                {isRefreshing && (
                    <div className="flex items-center text-sm text-gray-500">
                        <svg
                            className="animate-spin h-4 w-4 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Refreshing...
                    </div>
                )}
            </div>

            {/* Tabs */}
            <ProjectTabs projectId={projectId} />

            {/* Email List */}
            {emails.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <span className="text-6xl mb-4 block">📬</span>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No emails yet</h3>
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
                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                    !email.isRead ? "bg-blue-50" : ""
                                }`}
                                onClick={() =>
                                    (window.location.href = `/dashboard/devinbox/projects/${projectId}/emails/${email.id}`)
                                }
                            >
                                <div className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {email.from}
                                                </p>
                                                {!email.isRead && (
                                                    <span className="shrink-0 inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-600 truncate">
                                                {email.subject || "(No subject)"}
                                            </p>
                                        </div>
                                        <div className="ml-4 shrink-0">
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

            {/* Pagination */}
            {totalEmails > 0 && (
                <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                    <div className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                            {Math.min((currentPage - 1) * itemsPerPage + 1, totalEmails)}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, totalEmails)}
                        </span>{" "}
                        of <span className="font-medium">{totalEmails}</span> emails
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        <div className="flex items-center space-x-1">
                            {Array.from(
                                { length: Math.ceil(totalEmails / itemsPerPage) },
                                (_, i) => i + 1
                            )
                                .filter((page) => {
                                    // Show first page, last page, current page, and pages around current
                                    const totalPages = Math.ceil(totalEmails / itemsPerPage);
                                    return (
                                        page === 1 ||
                                        page === totalPages ||
                                        Math.abs(page - currentPage) <= 1
                                    );
                                })
                                .map((page, index, array) => {
                                    // Add ellipsis if there's a gap
                                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                                    return (
                                        <div key={page} className="flex items-center">
                                            {showEllipsis && (
                                                <span className="px-2 text-gray-500">...</span>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                    currentPage === page
                                                        ? "bg-blue-600 text-white"
                                                        : "text-gray-700 hover:bg-gray-50 border border-gray-300"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>

                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, Math.ceil(totalEmails / itemsPerPage))
                                )
                            }
                            disabled={currentPage >= Math.ceil(totalEmails / itemsPerPage)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
