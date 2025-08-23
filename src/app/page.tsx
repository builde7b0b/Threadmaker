'use client'

import { useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { ImageUploader } from '@/components/ImageUploader'
import { ThreadGenerator } from '@/components/ThreadGenerator'
import { ThreadPreview } from '@/components/ThreadPreview'
import { AIConfig } from '@/components/AIConfig'
import { TwitterAuth } from '@/components/TwitterAuth'
import { Auth } from '@/components/Auth'
import { Subscription } from '@/components/Subscription'
import { DevTools } from '@/components/DevTools'
import { UploadedImage, GeneratedThread } from '@/types'
import { User } from '@supabase/supabase-js'

const steps = ['Upload Screenshot', 'Generate Thread', 'Preview & Export']

export default function Home() {
  const [activeStep, setActiveStep] = useState(0)
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [generatedThread, setGeneratedThread] = useState<GeneratedThread | null>(null)
  const [hasValidAIConfig, setHasValidAIConfig] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Debug logging removed to prevent infinite re-renders

  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image)
    setActiveStep(1)
  }

  const handleThreadGenerated = (thread: GeneratedThread) => {
    setGeneratedThread(thread)
    setActiveStep(2)
  }

  const handleReset = () => {
    setActiveStep(0)
    setUploadedImage(null)
    setGeneratedThread(null)
  }

  const handleConfigChange = (hasValidKey: boolean) => {
    setHasValidAIConfig(hasValidKey)
  }

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    console.log('User authenticated:', user.email)
  }

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error)
  }

  const handleSignOut = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    console.log('User signed out')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          🧵 ThreadMaker
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          Transform your ChatGPT conversations into viral Twitter threads
        </Typography>
        
        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
          <Stepper 
            activeStep={activeStep} 
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{ 
              '& .MuiStepLabel-label': { 
                fontSize: isMobile ? '0.875rem' : '1rem' 
              } 
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      </Box>

      <Auth
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
        onSignOut={handleSignOut}
      />

      {isAuthenticated && currentUser && (
        <>
          <DevTools user={currentUser} />
          <Subscription user={currentUser} />
        </>
      )}

      <AIConfig onConfigChange={handleConfigChange} />

      <TwitterAuth />

      <Box sx={{ minHeight: '400px' }}>
        {activeStep === 0 && (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}
        
        {activeStep === 1 && uploadedImage && (
          <ThreadGenerator
            key={uploadedImage.file.name + uploadedImage.file.size}
            image={uploadedImage}
            onThreadGenerated={handleThreadGenerated}
            currentUser={currentUser}
          />
        )}
        
        {activeStep === 2 && generatedThread && (
          <ThreadPreview 
            thread={generatedThread} 
            onReset={handleReset}
          />
        )}
      </Box>
    </Container>
  )
}
