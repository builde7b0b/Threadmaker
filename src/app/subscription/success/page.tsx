'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Home as HomeIcon,
} from '@mui/icons-material'
import { getCurrentUser } from '@/lib/supabase'

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (sessionId) {
      console.log('✅ Subscription completed with session:', sessionId)
      // You could verify the session here if needed
    }
    
    setIsLoading(false)
  }, [searchParams])

  const handleGoHome = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: 'grey.50' }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          maxWidth: 500,
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <CheckIcon
          sx={{
            fontSize: 80,
            color: 'success.main',
            mb: 3,
          }}
        />

        <Typography variant="h4" gutterBottom color="success.main" fontWeight="bold">
          Welcome to Premium! 🎉
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Your subscription has been activated successfully
        </Typography>

        <Alert severity="success" sx={{ mb: 4 }}>
          <Typography variant="body1">
            You now have unlimited access to all premium features including:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Unlimited thread generation</li>
            <li>Twitter integration</li>
            <li>Advanced AI features</li>
            <li>Priority support</li>
          </Box>
        </Alert>

        <Box display="flex" flexDirection="column" gap={2}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGoHome}
            startIcon={<HomeIcon />}
            sx={{
              py: 1.5,
              backgroundColor: '#635bff',
              '&:hover': {
                backgroundColor: '#5a52e8',
              }
            }}
          >
            Start Creating Threads
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push('/subscription')}
            startIcon={<StarIcon />}
          >
            Manage Subscription
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          You'll receive a confirmation email shortly. Thank you for choosing ThreadMaker!
        </Typography>
      </Paper>
    </Box>
  )
}
