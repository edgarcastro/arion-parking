import { Button, Card, FieldError, Form, Input, Label, TextField, toast } from '@heroui/react'
import { useState, type FormEvent } from 'react'
import { saveSettings } from '../../lib/parking'
import { highestOccupiedSpot } from '../../lib/spots'
import { MAX_CAPACITY, type LotSettings } from '../../lib/types'

interface SettingsCardProps {
  settings: LotSettings
  occupied: number[]
  adminEmail: string
}

/** Remount with a `key` derived from `settings` to reflect changes made elsewhere. */
export function SettingsCard({ settings, occupied, adminEmail }: SettingsCardProps) {
  const [form, setForm] = useState({
    capacity: String(settings.capacity),
    hourlyRate: String(settings.hourlyRate),
    currency: settings.currency,
    graceMinutes: String(settings.graceMinutes),
  })
  const [pending, setPending] = useState(false)

  const minCapacity = Math.max(1, highestOccupiedSpot(occupied))
  const capacity = Number(form.capacity)
  const hourlyRate = Number(form.hourlyRate)
  const graceMinutes = Number(form.graceMinutes)
  const errors = {
    capacity: !Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY
      ? `Enter a whole number between 1 and ${MAX_CAPACITY}.`
      : capacity < minCapacity
        ? `Spot ${minCapacity} is occupied. Free spots ${capacity + 1}–${minCapacity} before reducing below ${minCapacity}.`
        : null,
    hourlyRate: !Number.isFinite(hourlyRate) || hourlyRate < 0 ? 'Enter 0 or a positive amount.' : null,
    currency: /^[A-Z]{3}$/.test(form.currency) ? null : 'Use a 3-letter code, e.g. USD.',
    graceMinutes: !Number.isInteger(graceMinutes) || graceMinutes < 0 || graceMinutes > 600 ? 'Between 0 and 600.' : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (hasErrors) return
    setPending(true)
    try {
      await saveSettings({ capacity, hourlyRate, currency: form.currency, graceMinutes }, adminEmail)
      toast.success('Settings saved', { description: `${capacity} spots available` })
    } catch {
      toast.danger('Could not save settings. Are you still an admin?')
    } finally {
      setPending(false)
    }
  }

  const field = (key: keyof typeof form, label: string, props: Partial<React.ComponentProps<typeof Input>> = {}) => (
    <TextField
      name={key}
      value={form[key]}
      onChange={(v) => setForm((f) => ({ ...f, [key]: key === 'currency' ? v.toUpperCase().slice(0, 3) : v }))}
      isInvalid={Boolean(errors[key])}
    >
      <Label>{label}</Label>
      <Input {...props} />
      <FieldError>{errors[key]}</FieldError>
    </TextField>
  )

  return (
    <Card>
      <Card.Header>
        <Card.Title>Lot settings</Card.Title>
        <Card.Description>Changes apply immediately on every screen.</Card.Description>
      </Card.Header>
      <Card.Content>
        <Form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {field('capacity', 'Parking spots', { type: 'number', min: 1, max: MAX_CAPACITY, inputMode: 'numeric' })}
          {field('hourlyRate', 'Hourly rate', { type: 'number', min: 0, step: '0.01', inputMode: 'decimal' })}
          {field('currency', 'Currency')}
          {field('graceMinutes', 'Free minutes (grace)', { type: 'number', min: 0, max: 600, inputMode: 'numeric' })}
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" isPending={pending} isDisabled={hasErrors}>
              Save settings
            </Button>
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
