import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  useInviteLink,
  useGenerateInviteLink,
  useUpdateInviteLink,
} from '@/hooks/groups/use-groups'
import { toast } from 'sonner'
import { Link, Copy, Check, RefreshCw, Share2, Loader2 } from 'lucide-react'

interface InviteLinkCardProps {
  groupId: string
}

export function InviteLinkCard({ groupId }: InviteLinkCardProps) {
  const { t } = useTranslation()
  const { data: linkData, isLoading } = useInviteLink(groupId)
  const generateLink = useGenerateInviteLink()
  const updateLink = useUpdateInviteLink()
  const [copied, setCopied] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const handleToggle = async (enabled: boolean) => {
    try {
      await updateLink.mutateAsync({ groupId, enabled })
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('common.error')
      toast.error(msg)
    }
  }

  const handleRegenerate = async () => {
    try {
      await generateLink.mutateAsync(groupId)
      setShowRegenerateConfirm(false)
      toast.success(t('groups.inviteLink.regenerated'))
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('common.error')
      toast.error(msg)
    }
  }

  const handleCopy = async () => {
    if (!linkData?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(linkData.inviteUrl)
      setCopied(true)
      toast.success(t('groups.inviteLink.copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleShare = async () => {
    if (!linkData?.inviteUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('groups.inviteLink.shareTitle'),
          url: linkData.inviteUrl,
        })
      } catch {
        // User cancelled share — ignore
      }
    } else {
      handleCopy()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="pt-3 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{t('groups.inviteLink.title')}</span>
        </div>
        <Switch
          checked={linkData?.inviteCodeEnabled || false}
          onCheckedChange={handleToggle}
          disabled={updateLink.isPending}
        />
      </div>

      {linkData?.inviteCodeEnabled && linkData?.inviteUrl && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? t('groups.inviteLink.copied') : t('groups.inviteLink.copy')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            {t('groups.inviteLink.share')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={generateLink.isPending}
            title={t('groups.inviteLink.regenerate')}
          >
            {generateLink.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={showRegenerateConfirm}
        onOpenChange={setShowRegenerateConfirm}
        title={t('groups.inviteLink.regenerate')}
        description={t('groups.inviteLink.regenerateConfirm')}
        onConfirm={handleRegenerate}
        confirmText={t('groups.inviteLink.regenerate')}
        isLoading={generateLink.isPending}
      />
    </div>
  )
}
