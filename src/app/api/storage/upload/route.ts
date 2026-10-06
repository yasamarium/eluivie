import { NextResponse } from 'next/server';
import { uploadAssetToStorage, logActivity, saveToGitHub, REPOS } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tag = (formData.get('tag') as string) || 'media-vault';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name;
    const contentType = file.type || 'application/octet-stream';

    let result;
    try {
      // 1. Primary: Store as GitHub Release Asset on eluivie-db-storage
      result = await uploadAssetToStorage(buffer, fileName, contentType, tag);
    } catch (releaseErr) {
      console.warn('Release asset upload fallback to raw contents:', releaseErr);
      // 2. Fallback: Store directly in storage repo contents
      const cleanName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const path = `uploads/${cleanName}`;
      await saveToGitHub(
        REPOS.STORAGE,
        path,
        buffer.toString('base64'),
        `Upload media asset: ${cleanName}`
      );
      result = {
        id: Date.now(),
        name: fileName,
        size: buffer.length,
        downloadUrl: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER || 'yasamarium'}/${REPOS.STORAGE}/main/${path}`,
        contentType,
        createdAt: new Date().toISOString(),
        tag: 'repo-contents',
      };
    }

    await logActivity({
      type: 'media_uploaded',
      actor: user.username,
      actorAvatar: user.avatarUrl,
      target: fileName,
      details: `Uploaded media: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`,
    });

    return NextResponse.json({ success: true, asset: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
