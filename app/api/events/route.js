import { NextResponse } from 'next/server';
import { saveJSON, listByPrefix } from '@/lib/blob';

const PREFIX = 'events';

export async function GET(req) {
  const result = await listByPrefix(PREFIX + '/');
  const events = [];
  for (const b of result.blobs) {
    if (b.pathname.endsWith('.json') && !b.pathname.endsWith('index.json')) {
      const res = await fetch(b.url);
      if (res.ok) events.push(await res.json());
    }
  }
  events.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
  return NextResponse.json({ events });
}

export async function POST(req) {
  const body = await req.json();
  const id = body.id || crypto.randomUUID();
  const event = { id, title: body.title, date: body.date, time: body.time, location: body.location||'', instructor: body.instructor||'', hours: Number(body.hours||8), notes: body.notes||'', createdAt: new Date().toISOString() };
  await saveJSON(`${PREFIX}/${id}.json`, event);
  return NextResponse.json({ ok: true, event });
}
