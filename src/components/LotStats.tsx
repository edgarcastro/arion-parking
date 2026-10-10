import { Meter } from '@heroui/react'

interface LotStatsProps {
  capacity: number
  occupied: number
  large?: boolean
}

export function LotStats({ capacity, occupied, large }: LotStatsProps) {
  const free = Math.max(0, capacity - occupied)
  const color = free === 0 ? 'danger' : free / capacity < 0.2 ? 'warning' : 'success'
  return (
    <div className={`flex items-center gap-4 ${large ? 'text-xl' : ''}`}>
      <div className="text-center leading-tight">
        <div className={`font-black tabular-nums ${large ? 'text-5xl' : 'text-3xl'} ${free === 0 ? 'text-danger' : 'text-success'}`}>
          {free}
        </div>
        <div className="text-xs font-semibold tracking-wider text-muted uppercase">{free === 0 ? 'Full' : 'Free'}</div>
      </div>
      <Meter
        aria-label="Occupancy"
        value={occupied}
        maxValue={capacity}
        color={color}
        className={large ? 'w-56' : 'w-28 sm:w-40'}
      >
        <Meter.Output className="text-xs text-muted">
          {occupied}/{capacity}
        </Meter.Output>
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>
    </div>
  )
}
