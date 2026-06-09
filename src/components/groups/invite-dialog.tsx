import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useInviteMember,
  useInviteLink,
  useGenerateInviteLink,
  type Group,
} from '@/hooks/groups/use-groups'
import { getErrorMessage } from '@/lib/api'
import { toast } from 'sonner'
import { Link as LinkIcon, Copy, Check, MessageCircle, Send, Mail, Share2 } from 'lucide-react'

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
}

const sectionLabel = 'mb-2 block text-[11px] font-bold uppercase tracking-[0.05em] text-fg-faint'

/** Invite / share sheet — email invite, shareable link (copy), and a 4-up share grid. */
export function InviteDialog({ open, onOpenChange, group }: InviteDialogProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)

  const inviteMember = useInviteMember()
  const { data: linkData } = useInviteLink(group.id)
  const generateLink = useGenerateInviteLink()

  const inviteUrl = linkData?.inviteCodeEnabled ? linkData?.inviteUrl ?? null : null
  const shareTitle = t('groups.inviteLink.shareTitle')

  const handleSend = async () => {
    if (!email.includes('@')) return
    try {
      await inviteMember.mutateAsync({ groupId: group.id, email })
      toast.success(t('groups.detail.inviteSent'))
      setEmail('')
    } catch (error) {
      toast.error(getErrorMessage(error, t('groups.detail.inviteError')))
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success(t('groups.inviteLink.copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleGenerate = async () => {
    try {
      await generateLink.mutateAsync(group.id)
    } catch (error) {
      toast.error(getErrorMessage(error, t('common.error')))
    }
  }

  const share = (kind: 'sms' | 'telegram' | 'email' | 'native') => () => {
    if (!inviteUrl) return
    const text = `${shareTitle} ${inviteUrl}`
    if (kind === 'sms') window.open(`sms:?&body=${encodeURIComponent(text)}`, '_blank')
    else if (kind === 'telegram')
      window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')
    else if (kind === 'email')
      window.open(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(inviteUrl)}`, '_blank')
    else if (navigator.share) navigator.share({ title: shareTitle, url: inviteUrl }).catch(() => {})
    else handleCopy()
  }

  const shareTargets = [
    { kind: 'sms' as const, icon: MessageCircle, label: t('groups.share.messages'), color: 'var(--brand-emerald)' },
    { kind: 'telegram' as const, icon: Send, label: t('groups.share.telegram'), color: 'var(--brand-cyan)' },
    { kind: 'email' as const, icon: Mail, label: t('groups.share.email'), color: 'var(--brand-violet)' },
    { kind: 'native' as const, icon: Share2, label: t('groups.share.more'), color: 'var(--fg-muted)' },
  ]

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('groups.invite.title', { name: group.name })}
      desktopWidth={452}
    >
      <div className="flex flex-col">
        <span className={sectionLabel}>{t('groups.invite.byEmail')}</span>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="name@example.com"
            className="flex-1"
          />
          <Button type="button" variant="brand" disabled={!email.includes('@')} loading={inviteMember.isPending} onClick={handleSend}>
            {t('groups.invite.send')}
          </Button>
        </div>

        <span className={`${sectionLabel} mt-5`}>{t('groups.invite.shareLink')}</span>
        {inviteUrl ? (
          <>
            <div className="flex h-[46px] items-center gap-2.5 rounded-xl border border-border bg-bg-subtle pl-3 pr-2">
              <LinkIcon className="size-[15px] shrink-0 text-muted-foreground" />
              <span className="t-num min-w-0 flex-1 truncate text-[13px] font-semibold">{inviteUrl}</span>
              <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                {copied ? t('groups.inviteLink.copied') : t('groups.inviteLink.copy')}
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {shareTargets.map((s) => (
                <Button
                  key={s.kind}
                  type="button"
                  variant="outline"
                  onClick={share(s.kind)}
                  className="h-auto flex-col gap-2 py-3 text-[11.5px] font-semibold"
                >
                  <span className="grid size-[38px] place-items-center rounded-full bg-bg-subtle" style={{ color: s.color }}>
                    <s.icon className="size-5" />
                  </span>
                  {s.label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={handleGenerate} loading={generateLink.isPending} className="w-full">
            <LinkIcon className="size-4" />
            {t('groups.invite.createLink')}
          </Button>
        )}
      </div>
    </GlassDialog>
  )
}
