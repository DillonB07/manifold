import clsx from 'clsx'
import { ContractComment } from 'common/comment'
import { BountiedQuestionContract } from 'common/contract'
import { User } from 'common/user'
import { formatMoney } from 'common/util/format'
import { forwardRef, useEffect, useState } from 'react'
import { addBounty, awardBounty } from 'web/lib/firebase/api'
import { Button } from '../buttons/button'
import { Col } from '../layout/col'
import { MODAL_CLASS, Modal } from '../layout/modal'
import { BuyAmountInput } from '../widgets/amount-input'
import { InfoTooltip } from '../widgets/info-tooltip'

const loadLottie = () => import('react-lottie')
const loadAwardJson = () => import('../../public/lottie/award.json')

let lottieLib: ReturnType<typeof loadLottie> | undefined
let animationJson: ReturnType<typeof loadAwardJson> | undefined

export const loadImports = async () => {
  lottieLib ??= loadLottie()
  animationJson ??= loadAwardJson()
  return {
    Lottie: (await lottieLib).default,
    award: await animationJson,
  }
}

export const LootboxAnimation = forwardRef(() => {
  const [imports, setImports] =
    useState<Awaited<ReturnType<typeof loadImports>>>()

  useEffect(() => {
    loadImports().then((x) => setImports(x))
  }, [])

  if (imports == null) {
    return null
  }
  const { Lottie, award } = imports
  return (
    <Lottie
      options={{
        loop: true,
        autoplay: true,
        animationData: award,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice',
        },
      }}
      height={200}
      width={200}
      isStopped={false}
      isPaused={false}
      style={{
        color: '#6366f1',
        pointerEvents: 'none',
        background: 'transparent',
      }}
    />
  )
})

export function BountyLeft(props: { bountyLeft: number; totalBounty: number }) {
  const { bountyLeft, totalBounty } = props
  if (!bountyLeft || bountyLeft < 1) {
    return (
      <span>
        No bounty left
        <InfoTooltip
          text={`The creator has already paid out the max amount of bounty.`}
          className="z-50"
          tooltipParams={{ placement: 'bottom-end' }}
        />
      </span>
    )
  }
  return (
    <span>
      <span className="font-semibold text-teal-600 dark:text-teal-400">
        {formatMoney(bountyLeft)}
      </span>
      <span className="text-ink-500 text-xs"> / {totalBounty} bounty left</span>{' '}
      <InfoTooltip
        text={`The bounty that the creator has left to pay out.`}
        className="z-50"
        tooltipParams={{ placement: 'bottom-end' }}
        size="sm"
      />
    </span>
  )
}

export function AwardBountyButton(props: {
  contract: BountiedQuestionContract
  comment: ContractComment
  user: User
  disabled: boolean
  buttonClassName?: string
}) {
  const { contract, comment, user, disabled, buttonClassName } = props
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const { bountyLeft } = contract
  const [amount, setAmount] = useState<number | undefined>(bountyLeft)
  if (!user || user.id !== contract.creatorId) {
    return <></>
  }

  async function onAwardBounty() {
    if (amount) {
      const newDefault = bountyLeft - amount
      awardBounty({
        contractId: contract.id,
        commentId: comment.id,
        amount: amount,
      }).then((_result) => {
        setOpen(false)
        setAmount(newDefault)
      })
    }
  }
  return (
    <>
      <Button
        className={clsx('py-1 text-xs', buttonClassName)}
        color={'gray-outline'}
        size="xs"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Award bounty
      </Button>
      <Modal open={open} setOpen={setOpen}>
        <Col className={MODAL_CLASS}>
          <LootboxAnimation />
          <span>
            Award <b>{comment.userName}</b> a bounty
          </span>
          <BuyAmountInput
            parentClassName="w-full"
            inputClassName="w-full max-w-none"
            amount={amount}
            onChange={(newAmount) => setAmount(newAmount)}
            error={error}
            setError={setError}
            minimumAmount={1}
            maximumAmount={bountyLeft}
            sliderOptions={{ show: true, wrap: false }}
            disregardUserBalance={true}
          />
          <Button
            size="lg"
            className="w-full"
            disabled={!!error}
            onClick={onAwardBounty}
          >
            Award {amount ? formatMoney(amount) : ''}
          </Button>
        </Col>
      </Modal>
    </>
  )
}

export function AddBountyButton(props: {
  contract: BountiedQuestionContract
  user: User
  buttonClassName?: string
}) {
  const { contract, user, buttonClassName } = props
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [amount, setAmount] = useState<number | undefined>(undefined)

  async function onAddBounty() {
    if (amount) {
      addBounty({
        contractId: contract.id,
        amount: amount,
      }).then((_result) => {
        setOpen(false)
      })
    }
  }
  return (
    <>
      <Button
        className={clsx(buttonClassName)}
        color={'green-outline'}
        onClick={() => setOpen(true)}
      >
        💸 Add bounty
      </Button>
      <Modal open={open} setOpen={setOpen}>
        <Col className={MODAL_CLASS}>
          <span>Add more bounty to this question</span>
          <BuyAmountInput
            parentClassName="w-full"
            inputClassName="w-full max-w-none"
            amount={amount}
            onChange={(newAmount) => setAmount(newAmount)}
            error={error}
            setError={setError}
            minimumAmount={1}
            sliderOptions={{ show: true, wrap: false }}
          />
          <Button
            size="lg"
            className="w-full"
            disabled={!!error}
            onClick={onAddBounty}
          >
            Add {amount ? formatMoney(amount) : ''}
          </Button>
        </Col>
      </Modal>
    </>
  )
}
