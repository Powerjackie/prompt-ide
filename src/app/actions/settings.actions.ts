"use server"

import path from "node:path"

import { AUTH_ERRORS, ensureAdmin } from "@/lib/action-auth"
import { prisma } from "@/lib/prisma"
import {
  getDefaultSettings,
  getEffectiveSettings as loadEffectiveSettings,
  mergeSettingsWithDefaults,
  sanitizeAgentSettingsPatch,
  sanitizeImportedSettings,
  sanitizeSettingsPatch,
} from "@/lib/settings/effective-settings"
import type { AdminDiagnostics, AppSettings } from "@/types/settings"

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

const SETTINGS_KEY = "app-settings"

const defaultSettings = getDefaultSettings()

async function readStoredSettingsState() {
  const row = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } })

  if (!row) {
    return {
      rowExists: false,
      settingsSource: "default-fallback" as const,
      settings: defaultSettings,
    }
  }

  try {
    return {
      rowExists: true,
      settingsSource: "persisted" as const,
      settings: mergeSettingsWithDefaults(JSON.parse(row.value)),
    }
  } catch {
    return {
      rowExists: true,
      settingsSource: "default-fallback" as const,
      settings: defaultSettings,
    }
  }
}

async function persistSettings(next: AppSettings) {
  await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  })
}

function getDatabaseTargetHint() {
  const value = process.env.DATABASE_URL ?? "file:./dev.db"

  if (value.startsWith("file:")) {
    const filePart = value.slice("file:".length)
    const hint = path.basename(filePart || "dev.db")
    return hint || "dev.db"
  }

  return "sqlite"
}

function buildAdminDiagnostics(
  settings: AppSettings,
  rowExists: boolean,
  settingsSource: "persisted" | "default-fallback"
): AdminDiagnostics {
  return {
    role: "admin",
    settingsKey: SETTINGS_KEY,
    settingsRowExists: rowExists,
    settingsSource,
    database: {
      provider: "sqlite",
      targetHint: getDatabaseTargetHint(),
      targetMode: "file-based sqlite",
    },
    effectiveSummary: {
      defaultView: settings.defaultView,
      defaultModel: settings.defaultModel,
      defaultStatus: settings.defaultStatus,
      agentEnabled: settings.agent.enabled,
      agentProvider: settings.agent.provider,
      analysisDepth: settings.agent.analysisDepth,
    },
    guardrails: {
      ensureAdminWriteGuard: true,
      settingsRouteAbsent: true,
      adminRouteOnly: true,
    },
  }
}

function parseImportPayload(payload: unknown) {
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload)
    } catch {
      throw new Error("Settings JSON is invalid")
    }
  }

  return payload
}

export async function getSettings(): Promise<ActionResult<AppSettings>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const state = await readStoredSettingsState()
    return { success: true, data: state.settings }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getEffectiveSettings(): Promise<ActionResult<AppSettings>> {
  return loadEffectiveSettings()
}

export async function updateSettings(
  data: Partial<AppSettings>
): Promise<ActionResult<AppSettings>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const sanitized = sanitizeSettingsPatch(data)
    const state = await readStoredSettingsState()
    const current = state.settings
    const merged = { ...current, ...sanitized }

    await persistSettings(merged)

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
    const sanitized = sanitizeAgentSettingsPatch(data)
    const state = await readStoredSettingsState()
    const current = state.settings
    const merged: AppSettings = {
      ...current,
      agent: { ...current.agent, ...sanitized },
    }

    await persistSettings(merged)

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
    await persistSettings(defaultSettings)

    return { success: true, data: defaultSettings }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getAdminDiagnostics(): Promise<ActionResult<AdminDiagnostics>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const state = await readStoredSettingsState()

    return {
      success: true,
      data: buildAdminDiagnostics(
        state.settings,
        state.rowExists,
        state.settingsSource
      ),
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function validateSettingsImport(
  payload: unknown
): Promise<ActionResult<AppSettings>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const parsed = parseImportPayload(payload)
    const settings = sanitizeImportedSettings(parsed)
    return { success: true, data: settings }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function replaceSettings(
  payload: unknown
): Promise<ActionResult<{ settings: AppSettings; diagnostics: AdminDiagnostics }>> {
  if (!(await ensureAdmin())) {
    return { success: false, error: AUTH_ERRORS.adminRequired }
  }

  try {
    const parsed = parseImportPayload(payload)
    const settings = sanitizeImportedSettings(parsed)

    await persistSettings(settings)

    return {
      success: true,
      data: {
        settings,
        diagnostics: buildAdminDiagnostics(settings, true, "persisted"),
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
