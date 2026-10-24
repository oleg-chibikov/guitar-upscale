import { createWorkerRequests } from "./workerRequests";

type Listener = (event: unknown) => void;

const createFakeWorker = () => {
  const listeners = new Map<string, Listener>();
  return {
    addEventListener: (type: string, listener: Listener) =>
      listeners.set(type, listener),
    postMessage: jest.fn(),
    answer: (requestId: number, text: string) =>
      listeners.get("message")?.({
        data: { data: { type: "result", requestId, payload: text } },
      }),
    fail: () => listeners.get("error")?.(new Error("crashed")),
  };
};

describe("createWorkerRequests", () => {
  it("gives each call the answer to its own request", async () => {
    const worker = createFakeWorker();
    const request = createWorkerRequests<string>(
      worker as unknown as Worker,
      "result",
    );
    const ids: number[] = [];
    const first = request((id) => ids.push(id));
    const second = request((id) => ids.push(id));

    worker.answer(ids[1], "second");
    worker.answer(ids[0], "first");

    await expect(first).resolves.toBe("first");
    await expect(second).resolves.toBe("second");
  });

  it("ignores other message types", async () => {
    const worker = createFakeWorker();
    const request = createWorkerRequests<string>(
      worker as unknown as Worker,
      "other",
    );
    const result = request(() => {});
    worker.answer(0, "wrong type");
    worker.fail();
    await expect(result).rejects.toThrow("crashed");
  });

  it("rejects pending calls when the worker fails", async () => {
    const worker = createFakeWorker();
    const request = createWorkerRequests<string>(
      worker as unknown as Worker,
      "result",
    );
    const result = request(() => {});
    worker.fail();
    await expect(result).rejects.toThrow("crashed");
  });
});
