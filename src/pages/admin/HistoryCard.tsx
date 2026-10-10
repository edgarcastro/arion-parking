import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button, Card, Input, Label, Table, TextField } from '@heroui/react'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { formatDuration, formatMoney } from '../../lib/fees'
import { normalizePlate } from '../../lib/plate'
import type { Session } from '../../lib/types'

const PAGE_SIZE = 25

function toSession(d: QueryDocumentSnapshot): Session {
  const data = d.data() as Omit<Session, 'id' | 'entryAt' | 'exitAt'> & { entryAt: Timestamp; exitAt: Timestamp | null }
  return { ...data, id: d.id, entryAt: data.entryAt.toDate(), exitAt: data.exitAt?.toDate() ?? null }
}

const formatDate = (d: Date | null) => d?.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) ?? '—'

/** Cars that already left, newest first. */
export function HistoryCard() {
  const [rows, setRows] = useState<Session[]>([])
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback((after: QueryDocumentSnapshot | null) => {
    const sessions = collection(db, 'sessions')
    const base = [where('status', '==', 'left'), orderBy('exitAt', 'desc')] as const
    const q = after
      ? query(sessions, ...base, startAfter(after), limit(PAGE_SIZE))
      : query(sessions, ...base, limit(PAGE_SIZE))
    return getDocs(q)
      .then((snap) => {
        const page = snap.docs.map(toSession)
        setRows((r) => (after ? [...r, ...page] : page))
        setCursor(snap.docs.at(-1) ?? null)
        setHasMore(snap.docs.length === PAGE_SIZE)
        setError(null)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load history.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(null)
  }, [load])

  const refresh = () => {
    setLoading(true)
    load(null)
  }

  const filter = normalizePlate(search)
  const visible = filter ? rows.filter((r) => r.plate.includes(filter)) : rows
  const total = visible.reduce((sum, r) => sum + (r.fee ?? 0), 0)
  const currency = visible.find((r) => r.currency)?.currency ?? 'USD'

  return (
    <Card>
      <Card.Header className="flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <Card.Title>History</Card.Title>
          <Card.Description>
            {visible.length} stays loaded · {formatMoney(total, currency)} collected
          </Card.Description>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
        <Button variant="ghost" size="sm" isIconOnly aria-label="Refresh history" onPress={refresh}>
          <ArrowPathIcon className="size-4" />
        </Button>
        <TextField aria-label="Search plate" value={search} onChange={setSearch} className="flex-1 sm:w-56">
          <Label className="sr-only">Search plate</Label>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted" />
            <Input placeholder="Search plate" className="w-full pl-9 font-mono uppercase" />
          </div>
        </TextField>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Parking history" className="min-w-[640px]">
              <Table.Header>
                <Table.Column isRowHeader>Plate</Table.Column>
                <Table.Column>Spot</Table.Column>
                <Table.Column>Entered</Table.Column>
                <Table.Column>Left</Table.Column>
                <Table.Column>Duration</Table.Column>
                <Table.Column>Fee</Table.Column>
              </Table.Header>
              <Table.Body
                items={visible}
                renderEmptyState={() => (
                  <div className="p-6 text-center text-muted">{loading ? 'Loading…' : 'No cars have left yet.'}</div>
                )}
              >
                {(row) => (
                  <Table.Row id={row.id}>
                    <Table.Cell className="font-mono font-semibold tracking-wider">{row.plate}</Table.Cell>
                    <Table.Cell>{row.spot}</Table.Cell>
                    <Table.Cell>{formatDate(row.entryAt)}</Table.Cell>
                    <Table.Cell>{formatDate(row.exitAt)}</Table.Cell>
                    <Table.Cell>{row.durationMinutes == null ? '—' : formatDuration(row.durationMinutes)}</Table.Cell>
                    <Table.Cell>{row.fee == null ? '—' : formatMoney(row.fee, row.currency ?? currency)}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        {hasMore && rows.length > 0 && (
          <Button variant="secondary" isPending={loading} onPress={() => {
              setLoading(true)
              load(cursor)
            }} className="self-center">
            Load more
          </Button>
        )}
      </Card.Content>
    </Card>
  )
}
