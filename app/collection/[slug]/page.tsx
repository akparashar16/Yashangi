/**
 * Collection Page
 * Dynamic route for collection pages (kurta, kurta-set, kurti, top, dress, co-ord-set)
 */

import CollectionPage from '@/components/Collection/CollectionPage';

export default function Collection({ params }: { params: { slug: string } }) {
  return <CollectionPage slug={params.slug} />;
}

