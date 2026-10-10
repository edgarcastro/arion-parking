import { ChevronDoubleRightIcon } from '@heroicons/react/24/solid'
import { AnimatePresence, motion } from 'motion/react'
import { type KeyboardEvent } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'
import { carColor } from '../../lib/spots'
import type { ParkedCar } from '../../lib/types'
import { CarSprite } from './CarSprite'

interface ParkingLotProps {
  capacity: number
  carsBySpot: Map<number, ParkedCar>
  onSelectCar: (car: ParkedCar) => void
  /** Spot that was just filled, to celebrate it. */
  highlightSpot?: number | null
  large?: boolean
}

type Facing = 'down' | 'up'

/**
 * Top-down parking lot. Spots are laid out in pairs of rows that face a shared
 * driving lane; the number of columns follows the available width.
 */
export function ParkingLot({ capacity, carsBySpot, onSelectCar, highlightSpot, large }: ParkingLotProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const spotWidth = large ? 108 : 76
  const columns = Math.max(2, Math.min(12, Math.floor((width || 600) / spotWidth)))

  const spots = Array.from({ length: capacity }, (_, i) => i + 1)
  const rows: number[][] = []
  for (let i = 0; i < spots.length; i += columns) rows.push(spots.slice(i, i + columns))
  const aisles: number[][][] = []
  for (let i = 0; i < rows.length; i += 2) aisles.push(rows.slice(i, i + 2))

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = Number((e.target as HTMLElement).dataset.spot)
    if (!current) return
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[e.key]
    if (!delta) return
    e.preventDefault()
    const next = Math.min(capacity, Math.max(1, current + delta))
    e.currentTarget.querySelector<HTMLElement>(`[data-spot="${next}"]`)?.focus()
  }

  return (
    <div
      ref={ref}
      onKeyDown={handleKeyDown}
      className="lot-asphalt relative w-full overflow-hidden rounded-3xl p-3 shadow-xl ring-1 ring-black/20 sm:p-5"
      role="grid"
      aria-label={`Parking lot with ${capacity} spots`}
    >
      <div className="flex flex-col gap-2">
        {aisles.map((aisle, a) => (
          <div key={a} className="flex flex-col">
            <SpotRow
              spots={aisle[0]}
              columns={columns}
              facing="down"
              {...{ carsBySpot, onSelectCar, highlightSpot, large }}
            />
            <Lane large={large} />
            {aisle[1] && (
              <SpotRow
                spots={aisle[1]}
                columns={columns}
                facing="up"
                {...{ carsBySpot, onSelectCar, highlightSpot, large }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Lane({ large }: { large?: boolean }) {
  return (
    <div className={`lot-lane relative flex items-center ${large ? 'h-16' : 'h-11'}`} aria-hidden="true">
      <ChevronDoubleRightIcon className="lot-arrow ml-1 size-5 text-white/40" />
      <ChevronDoubleRightIcon className="lot-arrow mr-1 ml-auto size-5 text-white/40" />
    </div>
  )
}

interface SpotRowProps {
  spots: number[]
  columns: number
  facing: Facing
  carsBySpot: Map<number, ParkedCar>
  onSelectCar: (car: ParkedCar) => void
  highlightSpot?: number | null
  large?: boolean
}

function SpotRow({ spots, columns, facing, carsBySpot, onSelectCar, highlightSpot, large }: SpotRowProps) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} role="row">
      {spots.map((spot) => (
        <Spot
          key={spot}
          spot={spot}
          facing={facing}
          car={carsBySpot.get(spot)}
          onSelectCar={onSelectCar}
          isHighlighted={spot === highlightSpot}
          large={large}
        />
      ))}
    </div>
  )
}

interface SpotProps {
  spot: number
  facing: Facing
  car?: ParkedCar
  onSelectCar: (car: ParkedCar) => void
  isHighlighted: boolean
  large?: boolean
}

function Spot({ spot, facing, car, onSelectCar, isHighlighted, large }: SpotProps) {
  // Cars arrive from (and leave into) the lane, which is below "down" rows and above "up" rows.
  const laneOffset = facing === 'down' ? '120%' : '-120%'
  const numberPosition = facing === 'down' ? 'top-1' : 'bottom-1'

  return (
    <div
      role="gridcell"
      className={`relative border-x-2 border-white/70 ${facing === 'down' ? 'border-t-2' : 'border-b-2'} ${large ? 'aspect-[3/5]' : 'aspect-[5/8]'}`}
    >
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 font-mono font-bold text-white/50 ${numberPosition} ${large ? 'text-base' : 'text-xs'}`}
      >
        {spot}
      </span>

      <AnimatePresence>
        {car ? (
          <motion.button
            key={car.sessionId}
            type="button"
            data-spot={spot}
            onClick={() => onSelectCar(car)}
            aria-label={`Car ${car.plate} in spot ${spot}. Select to check out.`}
            className="group absolute inset-[8%] flex cursor-pointer items-center justify-center rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            initial={{ y: laneOffset, x: '-60%', rotate: facing === 'down' ? -35 : 35, opacity: 0 }}
            animate={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
            exit={{ y: laneOffset, x: '80%', rotate: facing === 'down' ? 35 : -35, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            <CarSprite
              color={carColor(car.plate)}
              className={`h-full w-full drop-shadow-lg transition-[filter] group-hover:brightness-110 ${facing === 'down' ? 'rotate-180' : ''}`}
            />
            <span
              className={`absolute rounded-md bg-white px-1 font-mono font-bold tracking-wider text-slate-900 shadow ring-1 ring-slate-900/40 ${large ? 'text-sm' : 'text-[10px] leading-4'}`}
            >
              {car.plate}
            </span>
            {isHighlighted && <span className="lot-celebrate pointer-events-none absolute -inset-2 rounded-2xl ring-4 ring-amber-300" />}
          </motion.button>
        ) : (
          <span
            key="free"
            data-spot={spot}
            tabIndex={-1}
            aria-label={`Spot ${spot} free`}
            className="absolute inset-0 outline-none focus-visible:bg-white/10"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
