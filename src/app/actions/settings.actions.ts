"use server"

import { AUTH_ERRORS, ensureAdmin } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import type { AppSettings } from "@/types/settings"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

const SETTINGS_KEY = "app-settings"

const defaultSettings: AppSettings = {
  theme: "system",
  sidebarCollapsed: false,
  defaultView: "card",
  defaultModel: "universal",
  defaultStatus: "inbox",
  agent: {
    enabled: true,
    autoAnalyze: true,
    confidenceThreshold: 0.7,
    similarityThreshold: 0.3,
    riskThreshold: "medium",
    enableNormalization: false,
    enableModuleExtraction: true,
    analyzeOnPaste: true,
    provider: "minimax",
    analysisDepth: "standard",
  },
}

export async function getSettings(): Promise<ActionResult<AppSettings>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } })
    if (!row) return { success: true, data: defaultSettings }
    return { success: true, data: JSON.parse(row.value) as AppSettings }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updateSettings(
  data: Partial<AppSettings>
): Promise<ActionResult<AppSettings>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const existing = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } })
    const current = existing ? (JSON.parse(existing.value) as AppSettings) : defaultSettings
    const merged = { ...current, ...data }

    await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: JSON.stringify(merged) },
      update: { value: JSON.stringify(merged) },
    })

    return { success: true, data: merged }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updateAgentSettings(
  data: Partial<AppSettings["agent"]>
): Promise<ActionResult<AppSettings>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const existing = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } })
    const current = existing ? (JSON.parse(existing.value) as AppSettings) : defaultSettings
    const merged: AppSettings = {
      ...current,
      agent: { ...current.agent, ...data },
    }

    await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: JSON.stringify(merged) },
      update: { value: JSON.stringify(merged) },
    })

    return { success: true, data: merged }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function resetSettings(): Promise<ActionResult<AppSettings>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: JSON.stringify(defaultSettings) },
      update: { value: JSON.stringify(defaultSettings) },
    })

    return { success: true, data: defaultSettings }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
