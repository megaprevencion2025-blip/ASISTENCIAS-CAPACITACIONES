import { NextResponse } from 'next/server';
import { saveJSON, listByPrefix } from '@/lib/blob';

const PREFIX = 'attendees';

export async function GET() {
  const result = await listByPrefix(PREFIX + '/');
  const rows = [];
  for (const b of result.blobs) {
    if (b.pathname.endsWith('.json') && !b.pathname.endsWith('index.json')) {
      const res = await fetch(b.url);
      if (res.ok) rows.push(await res.json());
    }
  }
  rows.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
  return NextResponse.json({ attendees: rows });
}

export async function POST(req) {
  const body = await req.json();
  const id = body.id || crypto.randomUUID();
  const attendee = { id, eventId: body.eventId, fullName: body.fullName, idNumber: body.idNumber||'', email: body.email||'', role: body.role||'', company: body.company||'', code: body.code, createdAt: new Date().toISOString() };
  await saveJSON(`${PREFIX}/${id}.json`, attendee);
  return NextResponse.json({ ok: true, attendee });
}
