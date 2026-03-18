import { create } from "zustand"

interface TxToast {
  id: string
  status: "pending" | "success" | "error"
  txHash?: string
  message?: string
}

interface UIStore {
  txToasts: TxToast[]
  addTxToast: (toast: Omit<TxToast, "id">) => string
  updateTxToast: (id: string, update: Partial<TxToast>) => void
  removeTxToast: (id: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  txToasts: [],

  addTxToast: (toast) => {
    const id = crypto.randomUUID()
    set((s) => ({ txToasts: [...s.txToasts, { ...toast, id }] }))
    return id
  },

  updateTxToast: (id, update) =>
    set((s) => ({
      txToasts: s.txToasts.map((t) => (t.id === id ? { ...t, ...update } : t)),
    })),

  removeTxToast: (id) =>
    set((s) => ({ txToasts: s.txToasts.filter((t) => t.id !== id) })),
}))
