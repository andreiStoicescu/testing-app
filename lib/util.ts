export function sleep(min: number, max?: number) {
  const ms = max ? min + Math.floor(Math.random() * (max - min)) : min;
  return new Promise((r) => setTimeout(r, ms));
}

export function json(data: any, status = 200) {
  return Response.json(data, { status });
}
