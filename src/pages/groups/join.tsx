import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useJoinGroup } from '@/hooks/groups/use-join-group'
import { toast } from 'sonner'
import { Loader2, CircleAlert, Users } from 'lucide-react'

export default function JoinGroup() {
  const { t } = useTranslation()
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { mutateAsync: joinGroup } = useJoinGroup()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    let active = true

    joinGroup(code)
      .then((group) => {
        if (!active) return
        toast.success(t('groups.inviteLink.joinSuccess'))
        navigate(`/groups/${group.id}`, { replace: true })
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : t('groups.inviteLink.invalidLink'))
      })

    return () => { active = false }
  }, [code])

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center text-center py-8">
              <div className="p-3 rounded-full bg-destructive/10 mb-4">
                <CircleAlert className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="t-title mb-2">
                {t('groups.inviteLink.joinFailed')}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {error}
              </p>
              <Button asChild>
                <Link to="/groups">
                  <Users className="h-4 w-4 mr-2" />
                  {t('groups.inviteLink.goToGroups')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t('groups.inviteLink.joining')}</p>
      </div>
    </AppLayout>
  )
}
