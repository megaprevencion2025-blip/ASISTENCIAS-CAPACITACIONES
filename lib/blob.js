import { put, list, del } from '@vercel/blob';

export async function saveJSON(pathname, data) {
  const blob = await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  return blob;
}

export async function listByPrefix(prefix, limit=1000, cursor) {
  return await list({ prefix, limit, cursor });
}

export async function removeByPaths(paths) {
  return await del(paths);
}
