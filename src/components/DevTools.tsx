'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material'
import {
  DeveloperBoard as DevIcon,
  Update as UpdateIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { User } from '@supabase/supabase-js'

interface DevToolsProps {
  user: User
  onStatusUpdate?: () => void
}

export function DevTools({ user, onStatusUpdate }: DevToolsProps) {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  const subscriptionStatuses = [
    { value: 'free', label: 'Free Tier' },
    { value: 'active', label: 'Premium (Active)' },
    { value: 'canceled', label: 'Premium (Canceled)' },
    { value: 'past_due', label: 'Premium (Past Due)' },
  ]

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return

    setIsUpdating(true)

    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          status: selectedStatus,
          subscriptionId: selectedStatus !== 'free' ? `sub_test_${Date.now()}` : null
        })
      })

      const result = await response.json()

      if (response.ok) {
        setSnackbarMessage(`✅ Subscription status updated to ${selectedStatus}`)
        setSnackbarSeverity('success')
        onStatusUpdate?.()
      } else {
        setSnackbarMessage(`❌ Error: ${result.error}`)
        setSnackbarSeverity('error')
      }
    } catch (error) {
      console.error('Update error:', error)
      setSnackbarMessage('❌ Failed to update subscription status')
      setSnackbarSeverity('error')
    } finally {
      setIsUpdating(false)
      setSnackbarOpen(true)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 2,
        border: '2px dashed',
        borderColor: 'warning.main',
        backgroundColor: 'warning.light',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <DevIcon sx={{ color: 'warning.dark' }} />
        <Typography variant="h6" color="warning.dark">
          Development Tools
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          🔧 This section is only visible in development mode.
          Use these tools to test subscription features without setting up webhooks.
        </Typography>
      </Alert>

      <Box display="flex" flexDirection="column" gap={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Subscription Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            label="Subscription Status"
          >
            {subscriptionStatuses.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleUpdateStatus}
          disabled={!selectedStatus || isUpdating}
          startIcon={<UpdateIcon />}
          color="warning"
          sx={{ alignSelf: 'flex-start' }}
        >
          {isUpdating ? 'Updating...' : 'Update Status'}
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" display="block" color="text.secondary">
        <strong>Quick Actions:</strong>
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary">
        • Set to "Premium (Active)" to test unlimited features
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary">
        • Set to "Free Tier" to test usage limits
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary">
        • Check browser console for detailed logs
      </Typography>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setSnackbarOpen(false)}
            >
              <CloseIcon fontSize="small" />
            </Button>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  )
}
