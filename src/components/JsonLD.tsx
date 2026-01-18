/**
 * JsonLD Component
 *
 * Renders JSON-LD structured data as a script tag.
 * Can be used in both server and client components.
 */

interface JsonLDProps {
  data: object;
}

export function JsonLD({ data }: JsonLDProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
