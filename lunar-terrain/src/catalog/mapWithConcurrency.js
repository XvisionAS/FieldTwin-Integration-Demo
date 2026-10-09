/**
 * Maps items through an async function with at most `concurrency` calls in flight, keeping the input order.
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T) => Promise<R>} mapper
 * @returns {Promise<R[]>}
 */
export async function mapWithConcurrency(items, concurrency, mapper) {
  /** @type {R[]} */
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await mapper(items[index])
    }
  }
  const workers = []
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker())
  }
  await Promise.all(workers)
  return results
}
