import { put } from '@vercel/blob';
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File;
  const blob = await put(file.name, file, { access: 'public' });
  return Response.json({ url: blob.url });
}
