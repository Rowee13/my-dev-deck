export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">📧</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  DevInbox
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  Email Testing Tool
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/dashboard/devinbox"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Open DevInbox →
            </a>
          </div>
        </div>

        {/* More tools can be added here */}
        <div className="bg-white rounded-lg shadow p-6 opacity-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">🔧</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  More Tools
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  Coming Soon
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Welcome to DevDeck
        </h2>
        <p className="text-gray-600">
          Your all-in-one developer tools dashboard. Currently featuring DevInbox,
          a Mailinator-like email testing tool for developers.
        </p>
      </div>
    </div>
  );
}
