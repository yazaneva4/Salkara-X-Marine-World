/** Retry only conditional-write conflicts; read/parse failures must abort. */
export async function updateSnapshot<C, T>(
  read: () => Promise<{ coupons: C[]; etag: string | null }>,
  write: (coupons: C[], etag: string | null) => Promise<void>,
  mutate: (coupons: C[]) => T,
  conflict: (error: unknown) => boolean,
): Promise<T> {
  const attempts = 8;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const snapshot = await read();
    const result = mutate(snapshot.coupons);
    try {
      await write(snapshot.coupons, snapshot.etag);
      return result;
    } catch (error) {
      if (attempt === attempts - 1 || !conflict(error)) throw error;
      // Wait a short random time so writers that collided do not retry in
      // lockstep and collide again.
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1) + Math.random() * 150));
    }
  }
  throw new Error("Coupon storage is busy; try again.");
}
