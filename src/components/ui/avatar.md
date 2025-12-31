# Avatar Component

A component for displaying user avatars with initials or profile images.

## Functionality

- Displays profile image if `imageUrl` exists
- Displays user initials when there's no image:
  - **Full name**: "Konstantin Srdjanov" → "KS"
  - **First name only**: "Konstantin" → "K"
  - **Last name only**: "Srdjanov" → "S"
  - **No data**: "?"
- Initials are displayed in a circle with `primary` color (accent color from settings)

## Props

```typescript
interface AvatarProps {
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
```

## Sizes

- `sm`: 32px (8rem) - for member lists
- `md`: 40px (10rem) - default, for sidebar
- `lg`: 48px (12rem) - for profile page
- `xl`: 64px (16rem) - for settings

## Usage Examples

```tsx
// In sidebar
<Avatar 
  firstName={user?.firstName}
  lastName={user?.lastName}
  imageUrl={user?.profileImageUrl}
  size="md"
/>

// In group member list
<Avatar 
  firstName={member.user?.firstName}
  lastName={member.user?.lastName}
  imageUrl={member.user?.profileImageUrl}
  size="sm"
/>

// In settings page
<Avatar
  firstName={user?.firstName}
  lastName={user?.lastName}
  imageUrl={user?.profileImageUrl}
  size="xl"
  className="border"
/>
```

## Where It's Used

1. **App Layout** (`/src/components/layout/app-layout.tsx`) - User section in sidebar
2. **Settings** (`/src/pages/settings/index.tsx`) - Profile picture section
3. **Group Detail Modal** (`/src/components/groups/group-detail-modal.tsx`) - Group member list

## Styling

Avatar uses:
- `bg-primary` - accent color from theme (zinc, blue, green, purple, orange, rose)
- `text-primary-foreground` - contrast color for text
- `rounded-full` - rounded corners
- `font-semibold` - bold initials

The accent color automatically changes when the user changes the color in Settings.

