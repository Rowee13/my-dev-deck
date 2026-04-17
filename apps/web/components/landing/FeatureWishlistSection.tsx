import { fetchFeatureIdeas } from '../../lib/github';
import { FeatureWishlistItem } from './FeatureWishlistItem';

function getRepoUrl(): string {
  const owner = process.env.GITHUB_REPO_OWNER || 'Rowee13';
  const name = process.env.GITHUB_REPO_NAME || 'my-dev-deck';
  return `https://github.com/${owner}/${name}`;
}

export async function FeatureWishlistSection() {
  const ideas = await fetchFeatureIdeas();
  const repoUrl = getRepoUrl();
  const submitUrl = `${repoUrl}/discussions/new?category=feature-ideas`;
  const allUrl = `${repoUrl}/discussions`;

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What&apos;s next?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A community-driven wishlist. Upvote the ideas you want, or submit your own on GitHub.
          </p>
        </div>

        {ideas.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {ideas.map((idea) => (
              <FeatureWishlistItem key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-10 bg-slate-50 rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-2">No ideas yet.</p>
            <p className="text-sm text-gray-500">
              Be the first to share what you&apos;d like to see added to the deck.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href={submitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 transition-all"
          >
            Submit an idea
          </a>
          <a
            href={allUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            See all ideas on GitHub →
          </a>
        </div>
      </div>
    </section>
  );
}
