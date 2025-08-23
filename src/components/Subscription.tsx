'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
} from '@mui/material'
import {
  CreditCard as CreditCardIcon,
  Star as StarIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { User } from '@supabase/supabase-js'
import {
  checkSubscriptionStatus,
  getMonthlyUsage,
  getRemainingUsage,
  createCheckoutSession,
  createCustomerPortalSession,
  cancelSubscription,
  getUserProfile,
  UserProfile
} from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

interface SubscriptionProps {
  user: User
  onUpgrade?: () => void
  onManage?: () => void
}

interface SubscriptionState {
  profile: UserProfile | null
  usage: any
  remaining: number
  isLoading: boolean
  error: string | null
  actionLoading: boolean
}

export function Subscription({ user, onUpgrade, onManage }: SubscriptionProps) {
  const [state, setState] = useState<SubscriptionState>({
    profile: null,
    usage: null,
    remaining: 0,
    isLoading: true,
    error: null,
    actionLoading: false,
  })

  useEffect(() => {
    loadSubscriptionData()
  }, [user.id])

  const loadSubscriptionData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const [profile, usage] = await Promise.all([
        checkSubscriptionStatus(user.id).then(async (status) => {
          const profile = await getUserProfile(user.id)
          return profile
        }),
        getMonthlyUsage(user.id)
      ])

      const remaining = await getRemainingUsage(user.id, profile?.subscription_status === 'active' ? 'premium' : 'free')

      setState(prev => ({
        ...prev,
        profile,
        usage,
        remaining,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error loading subscription data:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load subscription data'
      }))
    }
  }

  const handleUpgrade = async () => {
    setState(prev => ({ ...prev, actionLoading: true }))

    try {
      const { url } = await createCheckoutSession(user.id)
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setState(prev => ({
        ...prev,
        actionLoading: false,
        error: 'Failed to start checkout process'
      }))
    }
  }

  const handleManageSubscription = async () => {
    setState(prev => ({ ...prev, actionLoading: true }))

    try {
      console.log('🔄 Creating customer portal session...')
      console.log('User profile:', state.profile)

      if (!state.profile?.stripe_customer_id) {
        throw new Error('No Stripe customer ID found. Please complete a payment first.')
      }

      const url = await createCustomerPortalSession()
      console.log('✅ Customer portal URL created:', url)
      window.location.href = url
    } catch (error) {
      console.error('❌ Error opening customer portal:', error)
      setState(prev => ({
        ...prev,
        actionLoading: false,
        error: error instanceof Error ? error.message : 'Failed to open subscription management'
      }))
    }
  }

  const handleCancelSubscription = async () => {
    if (!state.profile?.subscription_id || !confirm('Are you sure you want to cancel your subscription?')) {
      return
    }

    setState(prev => ({ ...prev, actionLoading: true }))

    try {
      await cancelSubscription(state.profile!.subscription_id!)
      await loadSubscriptionData() // Refresh data
    } catch (error) {
      console.error('Error canceling subscription:', error)
      setState(prev => ({
        ...prev,
        actionLoading: false,
        error: 'Failed to cancel subscription'
      }))
    }
  }

  const { profile, usage, remaining, isLoading, error, actionLoading } = state

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  const isPremium = profile?.subscription_status === 'active'
  const isPastDue = profile?.subscription_status === 'past_due'
  const isCanceled = profile?.subscription_status === 'canceled'

  const totalUsage = isPremium ? Infinity : 5
  const usedUsage = isPremium ? Infinity : (totalUsage - remaining)

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <CreditCardIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" color="primary">
            Subscription
          </Typography>
        </Box>

        <Chip
          label={isPremium ? 'Premium' : 'Free'}
          color={isPremium ? 'primary' : 'default'}
          variant={isPremium ? 'filled' : 'outlined'}
          icon={isPremium ? <StarIcon /> : undefined}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isPastDue && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your payment is past due. Please update your payment method.
        </Alert>
      )}

      {isCanceled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your subscription has been canceled and will end at the current billing period.
        </Alert>
      )}

      {/* Usage Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Monthly Usage
          </Typography>

          {!isPremium && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Threads Generated
                </Typography>
                <Typography variant="body2">
                  {usedUsage} / {totalUsage}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={(usedUsage / totalUsage) * 100}
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />

              <Typography variant="caption" color="text.secondary">
                {remaining} threads remaining this month
              </Typography>
            </>
          )}

          {isPremium && (
            <Box textAlign="center" py={2}>
              <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" color="success.main">
                Unlimited Usage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate as many threads as you want!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Subscription Actions */}
      <Box display="flex" flexDirection="column" gap={2}>
        {!isPremium ? (
          <Button
            variant="contained"
            size="large"
            onClick={handleUpgrade}
            disabled={actionLoading}
            startIcon={<StarIcon />}
            sx={{
              py: 1.5,
              backgroundColor: '#635bff',
              '&:hover': {
                backgroundColor: '#5a52e8',
              }
            }}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Upgrade to Premium - $5.00/month'}
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={handleManageSubscription}
              disabled={actionLoading || !state.profile?.stripe_customer_id}
              startIcon={<SettingsIcon />}
              sx={{ py: 1.5 }}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Manage Billing'}
            </Button>

            {state.profile?.subscription_id && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelSubscription}
                disabled={actionLoading || isCanceled}
                startIcon={<CancelIcon />}
                sx={{ py: 1.5 }}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Cancel Subscription'}
              </Button>
            )}
          </>
        )}

        {/* Customer Portal Info */}
        {!state.profile?.stripe_customer_id && isPremium && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💳 Your billing information will be available once your first payment processes.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Features Comparison */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {isPremium ? 'Premium Features' : 'Compare Plans'}
        </Typography>

        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckIcon sx={{ color: isPremium ? 'success.main' : 'text.secondary' }} />
            <Typography variant="body2">
              Unlimited thread generation
            </Typography>
            {!isPremium && <Chip label="Premium" size="small" color="primary" variant="outlined" />}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <CheckIcon sx={{ color: isPremium ? 'success.main' : 'text.secondary' }} />
            <Typography variant="body2">
              Twitter integration
            </Typography>
            {!isPremium && <Chip label="Premium" size="small" color="primary" variant="outlined" />}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <CheckIcon sx={{ color: 'success.main' }} />
            <Typography variant="body2">
              AI-powered content generation
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <CheckIcon sx={{ color: 'success.main' }} />
            <Typography variant="body2">
              5 threads per month (free)
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}
