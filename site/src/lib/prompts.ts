/**
 * The prompts collection (commerce/prompts/*.md, see content.config.ts):
 * one entry per file, looked up by file stem. The body is the repository
 * file's text, served verbatim by the markdown twins and shown in the
 * prompt box of the pages.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * The platforms with a write page, in the order the pages list them. The
 * generic prompts (write-generic-*.md) are built and committed with the set
 * and have no page: on another platform, the developer version is the route.
 */
export const WRITE_PLATFORMS = {
  shopify: { label: 'Shopify', titleSuffix: 'Shopify' },
  woocommerce: { label: 'WooCommerce', titleSuffix: 'WooCommerce' },
} as const;

export type WritePlatform = keyof typeof WRITE_PLATFORMS;

/** The prompt whose file is commerce/prompts/<stem>.md; throws when absent. */
export async function promptBody(stem: string): Promise<string> {
  const entries: CollectionEntry<'prompts'>[] = await getCollection('prompts');
  const entry = entries.find((e) => e.id === stem || e.id.endsWith(`/${stem}`));
  if (!entry) throw new Error(`prompt not found in commerce/prompts/: ${stem}.md`);
  if (entry.body === undefined) throw new Error(`prompt has no body: ${stem}.md`);
  // The glob loader drops the file's final newline; every prompt file ends
  // with one, and the markdown twins promise the repository file byte for
  // byte, so it is put back here.
  return entry.body.endsWith('\n') ? entry.body : `${entry.body}\n`;
}

/** The prompt set version line, the second line of a prompt's header block. */
export function promptSetLine(body: string): string {
  const line = body.split('\n').filter((l) => l.trim() !== '')[1] ?? '';
  if (!/^- Prompt set \d+\.\d+\.\d+, for commerce release \d+\.\d+\.\d+\.$/.test(line)) {
    throw new Error(`prompt set line missing or malformed: ${JSON.stringify(line)}`);
  }
  return line.replace(/^- /, '').replace(/\.$/, '');
}
