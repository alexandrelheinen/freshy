/** Return a required route param or a 400 JSON response. */
export function requireParam(
  c: {
    req: { param: (name: string) => string | undefined };
    json: (body: unknown, status?: number) => Response;
  },
  name: string,
): string | Response {
  const value = c.req.param(name);
  if (!value) {
    return c.json({ error: `Missing route parameter: ${name}` }, 400);
  }
  return value;
}

/** Extract an optional photo file from multipart form data. */
export function photoFromFormData(formData: FormData): File | undefined {
  const photoField = formData.get('photo');
  if (photoField instanceof File && photoField.size > 0) {
    return photoField;
  }
  return undefined;
}
