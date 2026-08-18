import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({
    base: './src/content/works',
    pattern: '**/*.{md,mdx}',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    title: z.string().default(''),
    type: z.enum(['music', 'code']).default('music'),
    date: z.coerce.date().default(new Date(0)),
    summary: z.string().default(''),
    tags: z.array(z.string()).default([]),
    link: z.string().optional(),
    audio: z.string().optional(),
    cover: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const posts = defineCollection({
  loader: glob({
    base: './src/content/posts',
    pattern: '**/*.{md,mdx}',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    title: z.string().default(''),
    date: z.coerce.date().default(new Date(0)),
    summary: z.string().default(''),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { works, posts };
