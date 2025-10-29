import { NextResponse } from 'next/server';
import { saveJSON, listByPrefix } from '@/lib/blob';

const PREFIX = 'checkins';

export async function GET() {
  const result = await listByPrefix(PREFIX + '/');
  const rows = [];
  for (const b of result.blobs) {
    if (b.pathname.endsWith('.json') && !b.pathname.endsWith('index.json')) {
      const res = await fetch(b.url);
      if (res.ok) rows.push(await res.json());
    }
  }
  rows.sort((a,b)=> (b.ts||'').localeCompare(a.ts||''));
  return NextResponse.json({ checkins: rows });
}

export async function POST(req) {
  const body = await req.json();
  const id = body.id || crypto.randomUUID();
  const item = { id, regId: body.regId, eventId: body.eventId, signatureDataUrl: body.signatureDataUrl||null, ts: new Date().toISOString() };
  await saveJSON(`${PREFIX}/${id}.json`, item);
  return NextResponse.json({ ok: true, checkin: item });
}
