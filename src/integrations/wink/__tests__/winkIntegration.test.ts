import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { resolveGlobalWink, resetGlobalWinkInit } from "../useWinkIntegration"
import type { WinkSDK } from "../types"

describe("Wink SDK v1 Integration (10_caro)", () => {
  let originalWink: unknown

  beforeEach(() => {
    resetGlobalWinkInit()
    originalWink = (globalThis as any).Wink
  })

  afterEach(() => {
    resetGlobalWinkInit()
    ;(globalThis as any).Wink = originalWink
  })

  it("resolves safely when window.Wink is absent (standalone mode)", async () => {
    delete (globalThis as any).Wink
    const sdk = await resolveGlobalWink()
    expect(sdk).toBeNull()
  })

  it("resolves and initializes window.Wink SDK v1 when present", async () => {
    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => mockSdk as WinkSDK),
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn(),
      can: vi.fn(() => true),
      status: "online",
    }

    ;(globalThis as any).window = globalThis
    ;(globalThis as any).Wink = mockSdk

    const sdk = await resolveGlobalWink()
    expect(mockSdk.init).toHaveBeenCalled()
    expect(sdk).toBe(mockSdk)
  })

  it("polls and waits for asynchronously injected window.Wink and its init() session", async () => {
    delete (globalThis as any).Wink
    ;(globalThis as any).window = globalThis

    let initResolved = false
    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 20))
        initResolved = true
        return mockSdk as WinkSDK
      }),
      can: vi.fn(() => true),
      status: "online",
    }

    const promise = resolveGlobalWink()

    setTimeout(() => {
      ;(globalThis as any).Wink = mockSdk
    }, 25)

    const sdk = await promise
    expect(mockSdk.init).toHaveBeenCalledTimes(1)
    expect(initResolved).toBe(true)
    expect(sdk).toBe(mockSdk)
  })

  it("shares in-flight promise and calls init() exactly once across concurrent callers", async () => {
    let initCalls = 0
    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => {
        initCalls++
        await new Promise((r) => setTimeout(r, 30))
        return mockSdk as WinkSDK
      }),
      can: vi.fn(() => true),
      status: "online",
    }

    ;(globalThis as any).window = globalThis
    ;(globalThis as any).Wink = mockSdk

    const [sdk1, sdk2, sdk3] = await Promise.all([
      resolveGlobalWink(),
      resolveGlobalWink(),
      resolveGlobalWink(),
    ])

    expect(initCalls).toBe(1)
    expect(mockSdk.init).toHaveBeenCalledTimes(1)
    expect(sdk1).toBe(mockSdk)
    expect(sdk2).toBe(mockSdk)
    expect(sdk3).toBe(mockSdk)
  })

  it("ensures readyPromise does not resolve prematurely before init() completes", async () => {
    let initCompleted = false
    let finishInit: () => void = () => {}
    const initGate = new Promise<WinkSDK>((r) => {
      finishInit = () => {
        initCompleted = true
        r(mockSdk as WinkSDK)
      }
    })

    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(() => initGate),
      can: vi.fn(() => true),
      status: "online",
    }

    ;(globalThis as any).window = globalThis
    ;(globalThis as any).Wink = mockSdk

    let promiseSettled = false
    const promise = resolveGlobalWink().then((res) => {
      promiseSettled = true
      return res
    })

    await new Promise((r) => setTimeout(r, 40))
    expect(promiseSettled).toBe(false)
    expect(initCompleted).toBe(false)

    finishInit()
    const sdk = await promise
    expect(promiseSettled).toBe(true)
    expect(initCompleted).toBe(true)
    expect(sdk).toBe(mockSdk)
  })

  it("resolves safely to null if init() rejects", async () => {
    const mockSdk: Partial<WinkSDK> = {
      init: vi.fn(async () => {
        throw new Error("Network failure during init")
      }),
      status: "online",
    }

    ;(globalThis as any).window = globalThis
    ;(globalThis as any).Wink = mockSdk

    const sdk = await resolveGlobalWink()
    expect(mockSdk.init).toHaveBeenCalledTimes(1)
    expect(sdk).toBeNull()
  })
})
