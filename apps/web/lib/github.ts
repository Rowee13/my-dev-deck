import 'server-only';

export interface FeatureIdea {
  id: string;
  title: string;
  bodyExcerpt: string;
  url: string;
  upvotes: number;
  commentCount: number;
}

interface DiscussionNode {
  id: string;
  title: string;
  bodyText: string;
  url: string;
  upvoteCount: number;
  comments: { totalCount: number };
}

interface GraphQLResponse {
  data?: {
    repository?: {
      discussions?: {
        nodes?: DiscussionNode[];
      };
    };
  };
  errors?: unknown;
}

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const EXCERPT_LENGTH = 120;
const REVALIDATE_SECONDS = 300; // 5 minutes

const QUERY = `
  query ($owner: String!, $name: String!, $category: ID!) {
    repository(owner: $owner, name: $name) {
      discussions(first: 5, categoryId: $category, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          id
          title
          bodyText
          url
          upvoteCount
          comments { totalCount }
        }
      }
    }
  }
`;

function excerpt(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= EXCERPT_LENGTH) return cleaned;
  return cleaned.slice(0, EXCERPT_LENGTH).trimEnd() + '…';
}

export async function fetchFeatureIdeas(): Promise<FeatureIdea[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const name = process.env.GITHUB_REPO_NAME;
  const category = process.env.GITHUB_DISCUSSIONS_CATEGORY_ID;

  if (!owner || !name || !category) return [];

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { owner, name, category },
      }),
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      console.error('[github] discussions fetch failed', res.status);
      return [];
    }

    const json = (await res.json()) as GraphQLResponse;
    if (json.errors) {
      console.error('[github] discussions GraphQL errors', json.errors);
      return [];
    }

    const nodes = json.data?.repository?.discussions?.nodes ?? [];
    return nodes.map((n) => ({
      id: n.id,
      title: n.title,
      bodyExcerpt: excerpt(n.bodyText ?? ''),
      url: n.url,
      upvotes: n.upvoteCount,
      commentCount: n.comments.totalCount,
    }));
  } catch (err) {
    console.error('[github] discussions fetch error', err);
    return [];
  }
}
