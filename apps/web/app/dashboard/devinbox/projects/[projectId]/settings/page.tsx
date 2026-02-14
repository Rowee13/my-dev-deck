"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectTabs } from "@/components/devinbox/ProjectTabs";
import { apiRequest } from "@/lib/api";

interface Project {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    createdAt: string;
    _count?: {
        emails: number;
    };
}

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Editable fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const res = await apiRequest(`/api/projects/${projectId}`);

            if (!res.ok) {
                throw new Error("Failed to fetch project");
            }

            const data = await res.json();
            setProject(data);
            setName(data.name);
            setDescription(data.description || "");
        } catch (error) {
            console.error("Error fetching project:", error);
            setError("Failed to load project");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");

        try {
            const res = await apiRequest(`/api/projects/${projectId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    name,
                    description: description || undefined,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update project");
            }

            const data = await res.json();
            setProject(data);
            alert("Project updated successfully!");
        } catch (error) {
            console.error("Error updating project:", error);
            setError("Failed to update project");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!project) return;

        if (
            !confirm(
                `Are you sure you want to delete "${project.name}"? This will permanently delete all emails associated with this project. This action cannot be undone.`,
            )
        ) {
            return;
        }

        try {
            const res = await apiRequest(`/api/projects/${projectId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete project");
            }

            router.push("/dashboard/devinbox");
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Failed to delete project");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Loading project...</div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-600">{error || "Project not found"}</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center mb-6">
                <Link href="/dashboard/devinbox" className="mr-4 text-gray-600 hover:text-gray-900">
                    ← Back
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            </div>

            {/* Tabs */}
            <ProjectTabs projectId={projectId} />

            {/* Settings Content */}
            <div className="space-y-8">
                {/* Email Configuration */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        📧 Email Configuration
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Your project receives emails at this domain:
                    </p>
                    <div className="flex items-center space-x-3 mb-4">
                        <code className="flex-1 text-lg bg-gray-100 text-zinc-900 px-4 py-3 rounded-md font-mono">
                            @{project.slug}.{process.env.NEXT_PUBLIC_DEVINBOX_DOMAIN || 'devinbox.local'}
                        </code>
                        <button
                            onClick={() => copyToClipboard(`@${project.slug}.${process.env.NEXT_PUBLIC_DEVINBOX_DOMAIN || 'devinbox.local'}`)}
                            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <p className="text-sm text-blue-900 mb-2">
                            <strong>Any email address</strong> at this domain will appear in your
                            inbox:
                        </p>
                        <ul className="text-sm text-blue-800 space-y-1 ml-4">
                            <li>✓ test@{project.slug}.{process.env.NEXT_PUBLIC_DEVINBOX_DOMAIN || 'devinbox.local'}</li>
                            <li>✓ admin@{project.slug}.{process.env.NEXT_PUBLIC_DEVINBOX_DOMAIN || 'devinbox.local'}</li>
                            <li>✓ hello@{project.slug}.{process.env.NEXT_PUBLIC_DEVINBOX_DOMAIN || 'devinbox.local'}</li>
                        </ul>
                    </div>
                </section>

                {/* Project Details */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Project Details</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Slug (subdomain)
                            </label>
                            <input
                                type="text"
                                value={project.slug}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Slug cannot be changed after creation
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                rows={3}
                                placeholder="Optional project description"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </section>

                {/* Statistics */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Total Emails</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {project._count?.emails || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Advanced Features - Coming Soon */}
                <section className="bg-white rounded-lg shadow p-6 opacity-60">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        🚀 Advanced Features
                    </h2>
                    <div className="space-y-4">
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-md">
                            <h3 className="font-medium text-gray-900 mb-2">⏰ Email Retention</h3>
                            <p className="text-sm text-gray-500">
                                Automatically delete emails after a specified number of days (Coming
                                Soon)
                            </p>
                        </div>
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-md">
                            <h3 className="font-medium text-gray-900 mb-2">🔗 Webhooks</h3>
                            <p className="text-sm text-gray-500">
                                Receive notifications when new emails arrive (Coming Soon)
                            </p>
                        </div>
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-md">
                            <h3 className="font-medium text-gray-900 mb-2">📮 Email Forwarding</h3>
                            <p className="text-sm text-gray-500">
                                Forward incoming emails to another address (Coming Soon)
                            </p>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
                    <h2 className="text-xl font-semibold text-red-600 mb-4">⚠️ Danger Zone</h2>
                    <p className="text-gray-600 mb-4">
                        Deleting this project will permanently remove all associated emails and
                        data. This action cannot be undone.
                    </p>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Delete Project
                    </button>
                </section>
            </div>
        </div>
    );
}
