import { NextResponse } from 'next/server';
import { FollowRecord } from '@/context/follow-context';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'lib', 'custom-follows-data.json');

let followsCache: FollowRecord[] = [];

function readFollowsFromDisk(): FollowRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading follows from disk:', e);
  }
  return [];
}

function writeFollowsToDisk(follows: FollowRecord[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(follows, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing follows to disk:', e);
  }
}

followsCache = readFollowsFromDisk();

export async function GET() {
  return NextResponse.json({ follows: followsCache });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === 'FOLLOW') {
      const record: FollowRecord = body.record;
      const exists = followsCache.some(
        f => f.followerUsername.toLowerCase() === record.followerUsername.toLowerCase() &&
             f.targetUsername.toLowerCase() === record.targetUsername.toLowerCase()
      );
      if (!exists) {
        followsCache.push(record);
        writeFollowsToDisk(followsCache);
      }
    } else if (body.action === 'UNFOLLOW') {
      const { followerUsername, targetUsername } = body;
      followsCache = followsCache.filter(
        f => !(f.followerUsername.toLowerCase() === followerUsername.toLowerCase() &&
               f.targetUsername.toLowerCase() === targetUsername.toLowerCase())
      );
      writeFollowsToDisk(followsCache);
    }
    return NextResponse.json({ success: true, follows: followsCache });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process follow' }, { status: 500 });
  }
}
