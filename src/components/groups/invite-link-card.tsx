import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
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
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Link className="h-4 w-4" />
          {t('groups.inviteLink.title')}
        </h4>
        <Switch
          checked={linkData?.inviteCodeEnabled || false}
          onCheckedChange={handleToggle}
          disabled={updateLink.isPending}
        />
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t('groups.inviteLink.description')}
      </p>

      {linkData?.inviteCodeEnabled && linkData?.inviteUrl && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              readOnly
              value={linkData.inviteUrl}
              className="text-xs font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title={t('groups.inviteLink.copy')}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              {t('groups.inviteLink.share')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={generateLink.isPending}
            >
              {generateLink.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t('groups.inviteLink.regenerate')}
            </Button>
          </div>
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
