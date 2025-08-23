'use client'

import { useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material'
import {
  Cancel as CancelIcon,
  Home as HomeIcon,
  Star as StarIcon,
} from '@mui/icons-material'

export default function SubscriptionCanceledPage() {
  const router = useRouter()

  const handleGoHome = () => {
    router.push('/')
  }

  const handleTryAgain = () => {
    router.push('/')
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
        <CancelIcon
          sx={{
            fontSize: 80,
            color: 'warning.main',
            mb: 3,
          }}
        />

        <Typography variant="h4" gutterBottom color="warning.main" fontWeight="bold">
          Subscription Canceled
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          No worries! You can upgrade anytime
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            You're still on the free plan with access to:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>5 threads per month</li>
            <li>AI-powered content generation</li>
            <li>Basic features</li>
          </Box>
        </Alert>

        <Box display="flex" flexDirection="column" gap={2}>
          <Button
            variant="contained"
            size="large"
            onClick={handleTryAgain}
            startIcon={<StarIcon />}
            sx={{
              py: 1.5,
              backgroundColor: '#635bff',
              '&:hover': {
                backgroundColor: '#5a52e8',
              }
            }}
          >
            Try Premium Again
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={handleGoHome}
            startIcon={<HomeIcon />}
          >
            Continue with Free Plan
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          You can upgrade to premium anytime from your dashboard. No pressure!
        </Typography>
      </Paper>
    </Box>
  )
}
