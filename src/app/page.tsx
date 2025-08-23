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
import { UploadedImage, GeneratedThread } from '@/types'

const steps = ['Upload Screenshot', 'Generate Thread', 'Preview & Export']

export default function Home() {
  const [activeStep, setActiveStep] = useState(0)
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [generatedThread, setGeneratedThread] = useState<GeneratedThread | null>(null)
  const [hasValidAIConfig, setHasValidAIConfig] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Debug logging
  console.log('Main page render:', {
    activeStep,
    hasUploadedImage: !!uploadedImage,
    hasGeneratedThread: !!generatedThread,
    hasValidAIConfig
  })

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
    console.log('AI config changed:', hasValidKey)
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

      <AIConfig onConfigChange={handleConfigChange} />

      <Box sx={{ minHeight: '400px' }}>
        {activeStep === 0 && (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}
        
        {activeStep === 1 && uploadedImage && (
          <ThreadGenerator
            key={uploadedImage.file.name + uploadedImage.file.size}
            image={uploadedImage}
            onThreadGenerated={handleThreadGenerated}
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
