import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  type Group,
  type CreateGroupInput,
} from '@/hooks/groups/use-groups'
import { toast } from 'sonner'

interface GroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Group | null
  mode: 'create' | 'edit'
}

type GroupFormData = {
  name: string
  description: string
  icon: string
}

export function GroupModal({ open, onOpenChange, group, mode }: GroupModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<GroupFormData>({
    defaultValues: {
      name: '',
      description: '',
      icon: '',
    },
  })

  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()

  useEffect(() => {
    if (open && group && mode === 'edit') {
      reset({
        name: group.name || '',
        description: group.description || '',
        icon: group.icon || '',
      })
    } else if (open && mode === 'create') {
      reset({
        name: '',
        description: '',
        icon: '',
      })
    }
  }, [open, group, mode, reset])

  const onSubmit = async (data: GroupFormData) => {
    try {
      const payload: CreateGroupInput = {
        name: data.name,
        description: data.description || undefined,
        icon: data.icon || undefined,
      }

      if (mode === 'create') {
        await createGroup.mutateAsync(payload)
        toast.success('Group created successfully')
      } else if (mode === 'edit' && group) {
        await updateGroup.mutateAsync({ id: group.id, data: payload })
        toast.success('Group updated successfully')
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(mode === 'create' ? 'Failed to create group' : 'Failed to update group', {
        description: errorMessage,
      })
    }
  }

  const handleDelete = async () => {
    if (!group) return

    if (window.confirm('Are you sure you want to delete this group? All receipts will be removed from this group.')) {
      try {
        await deleteGroup.mutateAsync(group.id)
        toast.success('Group deleted successfully')
        onOpenChange(false)
        reset()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred'
        toast.error('Failed to delete group', {
          description: errorMessage,
        })
      }
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Group' : 'Edit Group'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new expense group to share with others.'
              : 'Update the group details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name', { required: true })}
              placeholder="e.g., Vacation Trip, Household"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon (emoji)</Label>
            <Input
              id="icon"
              {...register('icon')}
              placeholder="e.g., 🏠, ✈️, 🛒"
              maxLength={4}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteGroup.isPending || isSubmitting}
                className="sm:mr-auto"
              >
                {deleteGroup.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createGroup.isPending || updateGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createGroup.isPending || updateGroup.isPending}
            >
              {isSubmitting || createGroup.isPending || updateGroup.isPending
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Updating...'
                : mode === 'create'
                ? 'Create'
                : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

