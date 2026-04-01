"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SkillSchemaMap } from "@/types/skill"

interface SkillSchemaEditorProps {
  label: string
  description: string
  value: SkillSchemaMap
  emptyLabel: string
  keyPlaceholder: string
  valuePlaceholder: string
  addLabel: string
  onChange: (value: SkillSchemaMap) => void
}

type SchemaRow = {
  key: string
  value: string
}

function rowsFromValue(value: SkillSchemaMap): SchemaRow[] {
  const rows = Object.entries(value).map(([key, val]) => ({ key, value: val }))
  return rows.length > 0 ? rows : [{ key: "", value: "" }]
}

function valueFromRows(rows: SchemaRow[]): SkillSchemaMap {
  return Object.fromEntries(
    rows
      .map((row) => ({
        key: row.key.trim(),
        value: row.value.trim(),
      }))
      .filter((row) => row.key.length > 0 && row.value.length > 0)
      .map((row) => [row.key, row.value])
  )
}

export function SkillSchemaEditor({
  label,
  description,
  value,
  emptyLabel,
  keyPlaceholder,
  valuePlaceholder,
  addLabel,
  onChange,
}: SkillSchemaEditorProps) {
  const [rows, setRows] = useState<SchemaRow[]>(() => rowsFromValue(value))

  useEffect(() => {
    setRows(rowsFromValue(value))
  }, [value])

  const updateRows = (nextRows: SchemaRow[]) => {
    setRows(nextRows)
    onChange(valueFromRows(nextRows))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${index}-${row.key}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Input
              value={row.key}
              onChange={(event) => {
                const nextRows = rows.map((item, rowIndex) =>
                  rowIndex === index ? { ...item, key: event.target.value } : item
                )
                updateRows(nextRows)
              }}
              placeholder={keyPlaceholder}
            />
            <Input
              value={row.value}
              onChange={(event) => {
                const nextRows = rows.map((item, rowIndex) =>
                  rowIndex === index ? { ...item, value: event.target.value } : item
                )
                updateRows(nextRows)
              }}
              placeholder={valuePlaceholder}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-2xl"
              onClick={() => {
                const nextRows = rows.filter((_, rowIndex) => rowIndex !== index)
                updateRows(nextRows.length > 0 ? nextRows : [{ key: "", value: "" }])
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {Object.keys(value).length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="rounded-2xl"
        onClick={() => updateRows([...rows, { key: "", value: "" }])}
      >
        <Plus className="mr-1 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  )
}
