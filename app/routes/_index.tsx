import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Suspense, useState, useCallback} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {GoogleMap, Marker, useLoadScript} from '@react-google-maps/api';
import type {
  CollectionProductsQuery,
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  const {
    storefront,
    env,
    env: {GOOGLE_MAPS_API_KEY: mapsApiKey},
  } = context;
  console.log(env)
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const featuredCollection = collections.nodes[0];
  const collectionProducts = storefront.query(COLLECTION_PRODUCTS_QUERY, {
    variables: {
      collectionHandle: 'essenciais',
    },
  });
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);

  return defer({
    collectionProducts,
    featuredCollection,
    recommendedProducts,
    mapsApiKey,
  });
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  console.log(data)

  return (
    <div className="home">
      <FeaturedCollectionProducts collection={data.collectionProducts} />
      <Map apiKey={data.mapsApiKey} />
    </div>
  );
}

function Map({apiKey}: {apiKey: string}) {
  const {isLoaded, loadError} = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{height: '400px', width: '400px'}}
      center={{lat: -27.5947967, lng: -48.55839}}
      zoom={15}
    >
      <Marker position={{lat: -27.5947967, lng: -48.55839}} />
    </GoogleMap>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery>;
}) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="recommended-products-grid">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="recommended-product"
                  to={`/products/${product.handle}`}
                >
                  <Image
                    data={product.images.nodes[0]}
                    aspectRatio="1/1"
                    sizes="(min-width: 45em) 20vw, 50vw"
                  />
                  <h4>{product.title}</h4>
                  <small>
                    <Money data={product.priceRange.minVariantPrice} />
                  </small>
                </Link>
              ))}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

function FeaturedCollectionProducts({
  collection,
}: {
  collection: Promise<CollectionProductsQuery>;
}) {
  return (
    <div className="recommended-products">
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={collection}>
          {({collection}) =>
            collection && (
              <>
                <h1>{collection.title}</h1>
                <div className="recommended-products-grid">
                  {collection.products.nodes.map((product) => (
                    <Link
                      key={product.id}
                      className="recommended-product"
                      to={`/products/${product.handle}`}
                    >
                      <Image
                        data={product.images.nodes[0]}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 50vw"
                      />
                      <h4>{product.title}</h4>
                      <small>
                        <Money data={product.priceRange.minVariantPrice} />
                      </small>
                    </Link>
                  ))}
                </div>
                <Link
                  className="featured-collection"
                  to={`/collections/${collection.handle}`}
                >
                  <h3>Ver Mais</h3>
                </Link>
              </>
            )
          }
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;

const COLLECTION_PRODUCTS_QUERY = `#graphql
  fragment CollectionProducts on Collection {
    id
    title
    handle
    products(first: 4, sortKey: RELEVANCE, reverse: true) {
      nodes {
        id
        title
        handle
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 1) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
  }
 
  query CollectionProducts($collectionHandle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      collection(handle: $collectionHandle) {
        ...CollectionProducts
      }
  }
` as const;
