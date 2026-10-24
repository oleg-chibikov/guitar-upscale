type WorkerLike = Pick<Worker, "addEventListener" | "postMessage">;

type ResultMessage<T> = {
  data: { type: string; requestId: number; payload: T };
};

/**
 * Sends requests to a worker and gives each caller the answer to its own request.
 * Parallel calls would otherwise all take the first answer that comes back.
 */
export const createWorkerRequests = <T>(
  worker: WorkerLike,
  resultType: string,
) => {
  const pending = new Map<
    number,
    { resolve: (data: T) => void; reject: (reason: unknown) => void }
  >();
  let nextRequestId = 0;

  worker.addEventListener("message", (event: MessageEvent) => {
    const { type, requestId, payload } = (event.data as ResultMessage<T>).data;
    if (type !== resultType) {
      return;
    }
    const request = pending.get(requestId);
    pending.delete(requestId);
    request?.resolve(payload);
  });

  worker.addEventListener("error", (error) => {
    for (const request of pending.values()) {
      request.reject(error);
    }
    pending.clear();
  });

  return (send: (requestId: number) => void): Promise<T> =>
    new Promise((resolve, reject) => {
      const requestId = nextRequestId++;
      pending.set(requestId, { resolve, reject });
      send(requestId);
    });
};
