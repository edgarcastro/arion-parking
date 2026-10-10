import { PlusIcon } from '@heroicons/react/24/solid'
import { Button, FieldError, Form, Input, Label, TextField, toast } from '@heroui/react'
import { useState, type FormEvent } from 'react'
import { ParkingError, parkCar } from '../lib/parking'
import { isValidPlate, normalizePlate, PLATE_FORMAT_HINT, PLATE_LENGTH } from '../lib/plate'

interface AddCarBarProps {
  occupied: number[]
  isFull: boolean
  onParked: (spot: number) => void
  large?: boolean
  inputRef?: React.Ref<HTMLInputElement>
  value: string
  onChange: (value: string) => void
}

export function AddCarBar({ occupied, isFull, onParked, large, inputRef, value, onChange }: AddCarBarProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const plate = normalizePlate(value)
    if (!isValidPlate(plate)) {
      setError(PLATE_FORMAT_HINT)
      return
    }
    setPending(true)
    try {
      const result = await parkCar(plate, occupied)
      toast.success(`${result.plate} parked`, { description: `Go to spot ${result.spot}` })
      onChange('')
      setError(null)
      onParked(result.spot)
    } catch (err) {
      const message = err instanceof ParkingError ? err.message : 'Could not park the car. Try again.'
      setError(message)
      toast.danger(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Form onSubmit={submit} className="flex w-full items-start gap-2 sm:gap-3">
      <TextField
        name="plate"
        aria-label="License plate"
        className="flex-1"
        value={value}
        onChange={(v) => {
          onChange(normalizePlate(v).slice(0, PLATE_LENGTH))
          setError(null)
        }}
        isInvalid={Boolean(error)}
        isDisabled={isFull}
        autoComplete="off"
        fullWidth
      >
        <Label className="sr-only">License plate</Label>
        <Input
          ref={inputRef}
          placeholder={isFull ? 'Lot is full' : 'Plate, e.g. ABC123'}
          maxLength={PLATE_LENGTH}
          autoCapitalize="characters"
          spellCheck={false}
          className={`font-mono tracking-widest uppercase ${large ? 'h-16 text-2xl' : 'h-12 text-lg'}`}
        />
        <FieldError>{error}</FieldError>
      </TextField>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isPending={pending}
        isDisabled={isFull || !value}
        className={large ? 'h-16 px-8 text-xl' : 'h-12'}
      >
        <PlusIcon className="size-5" />
        Park
      </Button>
    </Form>
  )
}
