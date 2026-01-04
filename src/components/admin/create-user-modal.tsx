import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateUser, type CreateUserInput } from '@/hooks/admin/use-admin-users'

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const { t } = useTranslation()
  const createUser = useCreateUser()
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user',
    },
  })

  const onSubmit = async (data: CreateUserInput) => {
    try {
      await createUser.mutateAsync({
        ...data,
        role: selectedRole,
      })
      toast.success(t('admin.users.createSuccess'))
      reset()
      setSelectedRole('user')
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(t('admin.users.createError'), {
        description: errorMessage,
      })
    }
  }

  const handleClose = () => {
    reset()
    setSelectedRole('user')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('admin.users.createTitle')}</DialogTitle>
          <DialogDescription>{t('admin.users.createDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('admin.users.form.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('admin.users.form.emailPlaceholder')}
              {...register('email', {
                required: t('admin.users.form.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('admin.users.form.emailInvalid'),
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('admin.users.form.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('admin.users.form.passwordPlaceholder')}
              {...register('password', {
                required: t('admin.users.form.passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('admin.users.form.passwordMinLength'),
                },
              })}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('admin.users.form.firstName')}</Label>
              <Input
                id="firstName"
                placeholder={t('admin.users.form.firstNamePlaceholder')}
                {...register('firstName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t('admin.users.form.lastName')}</Label>
              <Input
                id="lastName"
                placeholder={t('admin.users.form.lastNamePlaceholder')}
                {...register('lastName')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t('admin.users.form.role')}</Label>
            <Select value={selectedRole} onValueChange={(value: 'user' | 'admin') => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t('admin.users.form.roleUser')}</SelectItem>
                <SelectItem value="admin">{t('admin.users.form.roleAdmin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
