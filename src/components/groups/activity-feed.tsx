import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useGroupActivities, type GroupActivity } from '@/hooks/groups/use-groups'
import { Loader2, Activity, UserPlus, UserMinus, Receipt, Settings, CreditCard, Users, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, sr } from 'date-fns/locale'
import i18n from 'i18next'

interface ActivityFeedProps {
  groupId: string
}

const activityIcons: Record<string, React.ElementType> = {
  group_created: Users,
  group_updated: Settings,
  group_archived: Settings,
  group_unarchived: Settings,
  member_invited: UserPlus,
  member_joined: UserPlus,
  member_left: UserMinus,
  member_removed: UserMinus,
  receipt_added: Receipt,
  receipt_updated: Receipt,
  receipt_deleted: Receipt,
  settlement_created: CreditCard,
}

export function ActivityFeed({ groupId }: ActivityFeedProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useGroupActivities(groupId, 20)

  const [expanded, setExpanded] = useState(false)
  const allActivities = data?.data || []
  const activities = expanded ? allActivities : allActivities.slice(0, 5)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = i18n.language === 'sr' ? sr : enUS
    return formatDistanceToNow(date, { addSuffix: true, locale })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getActivityMessage = (activity: GroupActivity) => {
    const type = activity.type as string
    const translationKey = `groups.activities.types.${type}`

    // Handle interpolation for certain activity types
    if (type === 'member_invited' && activity.metadata?.email) {
      return t(translationKey, { email: activity.metadata.email })
    }

    return t(translationKey, { defaultValue: type })
  }

  const getActivityDetails = (activity: GroupActivity) => {
    const metadata = activity.metadata
    if (!metadata) return null

    // Show receipt details (store name + amount + split info)
    if (activity.type === 'receipt_added' && metadata.amount && metadata.currency) {
      const storeName = metadata.storeName || t('common.unknown')
      let splitText = ''
      if (metadata.splitType === 'all') {
        splitText = ` · ${t('groups.activities.betweenAllMembers')}`
      } else if (metadata.splitType === 'custom' && metadata.participantNames) {
        splitText = ` · ${t('groups.activities.betweenMembers', { names: metadata.participantNames.join(', ') })}`
      }
      return `${storeName} - ${formatAmount(metadata.amount, metadata.currency)}${splitText}`
    }

    // Show settlement details (amount + participants)
    if (activity.type === 'settlement_created' && metadata.settlementAmount && metadata.currency) {
      const from = metadata.fromUserName || ''
      const to = metadata.toUserName || ''
      return `${from} → ${to}: ${formatAmount(metadata.settlementAmount, metadata.currency)}`
    }

    // Show member name for leave/remove events
    if ((activity.type === 'member_left' || activity.type === 'member_removed') && metadata.memberName) {
      return metadata.memberName
    }

    return null
  }

  const getUserName = (activity: GroupActivity) => {
    if (activity.user) {
      const { firstName, lastName, email } = activity.user
      if (firstName || lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim()
      }
      return email
    }
    return t('common.unknown')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t('groups.activities.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('groups.activities.noActivities')}
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity: GroupActivity) => {
              const Icon = activityIcons[activity.type] || Activity

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="p-2 rounded-full bg-muted shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{getUserName(activity)}</span>{' '}
                      <span className="text-muted-foreground">
                        {getActivityMessage(activity)}
                      </span>
                    </p>
                    {getActivityDetails(activity) && (
                      <p className="text-sm text-primary font-medium mt-0.5">
                        {getActivityDetails(activity)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
            {!expanded && allActivities.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setExpanded(true)}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                {t('groups.activities.loadMore')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
