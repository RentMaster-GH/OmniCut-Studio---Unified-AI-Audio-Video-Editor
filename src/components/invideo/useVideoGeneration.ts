export async function generateVideoAPI(payload: any) {
  const res = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed');
  
  // If still processing, poll check-status
  if (data.taskId && !data.url) {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 4000));
      const check = await fetch(`/api/check-status?taskId=${data.taskId}&provider=${data.provider}`);
      const status = await check.json();
      if (status.url) return { ...data, url: status.url };
      if (status.status === 'failed') throw new Error(status.error || 'Failed');
    }
    throw new Error('Timeout - still processing on server');
  }
  return data;
}
