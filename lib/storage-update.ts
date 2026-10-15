/** Retry only conditional-write conflicts; read/parse failures must abort. */
export async function updateSnapshot<C, T>(
  read: () => Promise<{ coupons: C[]; etag: string | null }>,
  write: (coupons: C[], etag: string | null) => Promise<void>,
  mutate: (coupons: C[]) => T,
  conflict: (error: unknown) => boolean,
): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const snapshot = await read();
    const result = mutate(snapshot.coupons);
    try {
      await write(snapshot.coupons, snapshot.etag);
      return result;
    } catch (error) {
      if (attempt === 4 || !conflict(error)) throw error;
    }
  }
  throw new Error("Coupon storage is busy; try again.");
}
