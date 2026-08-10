import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Kauch {
  id: number;
  name: string;
  description: string;
  avatar_url: string | null;
}

async function getKauch(id: string): Promise<Kauch | null> {
  try {
    const res = await fetch(`${API}/kauch/${id}/`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const kauch = await getKauch(params.id);
  
  if (!kauch) {
    return {
      title: 'Kauch Profile',
      description: 'View this profile on Kauchy'
    };
  }

  const title = `${kauch.name} on Kauchy`;
  const description = kauch.description || `Discover the latest drops from ${kauch.name} on Kauchy.`;
  const image = kauch.avatar_url || '/logo.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function KauchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
