import type { Metadata } from 'next';
import VendorProfileClient from './VendorProfileClient';

const API = process.env.NEXT_PUBLIC_API_URL;

export async function generateMetadata(
  { searchParams }: { searchParams: { vendorId?: string } }
): Promise<Metadata> {
  const vendorId = searchParams.vendorId;
  const profileUrl = vendorId ? `https://kauchy.com/vendor-profile?vendorId=${vendorId}` : 'https://kauchy.com/vendor-profile';

  if (!vendorId) {
    return {
      title: 'Vendor Profile | Kauchy',
      description: 'View this vendor on Kauchy',
    };
  }

    try {
    const res = await fetch(`${API}/auth/user/${vendorId}/`, { next: { revalidate: 60 } });
    if (res.ok) {
      const vendorData = await res.json();
      const vendor = vendorData.info || vendorData;
      
      const title = `${vendor.username} on Kauchy`;
      const description = vendor.bio || `Shop amazing products from ${vendor.username} on Kauchy!`;
      const image = vendor.profile_url || vendor.pfp || '/lightmodelogo.png';

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          type: 'profile',
          url: profileUrl,
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
  } catch (error) {
    console.error("Failed to fetch vendor metadata:", error);
  }

  return {
    title: 'Vendor Profile | Kauchy',
    description: 'View this vendor on Kauchy',
    openGraph: {
      title: 'Vendor Profile | Kauchy',
      description: 'View this vendor on Kauchy',
      url: profileUrl,
      type: 'profile',
    },
  };
}

export default function VendorProfilePage() {
  return <VendorProfileClient />;
}
