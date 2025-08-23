import { GeneratedThread } from '@/types'
import OpenAI from 'openai'

interface ThreadGenerationOptions {
  extractedText: string
  style?: 'educational' | 'tips' | 'story' | 'viral'
  useAI?: boolean
}

// Initialize OpenAI client with dynamic API key
const getOpenAIClient = () => {
  // Try multiple sources for the API key
  const apiKey = localStorage.getItem('openai_api_key') ||
                 process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
                 'demo-key'

  console.log('🔑 OpenAI client initialization:', {
    hasLocalStorageKey: !!localStorage.getItem('openai_api_key'),
    hasEnvKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    usingKey: apiKey === 'demo-key' ? 'demo-key' : 'real-key',
    keyPrefix: apiKey === 'demo-key' ? 'demo' : apiKey.substring(0, 10) + '...',
    isValidFormat: apiKey.startsWith('sk-') && apiKey.length > 20
  })

  if (apiKey === 'demo-key') {
    throw new Error('No valid OpenAI API key found. Please configure your API key first.')
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  })
}

export async function generateThreadFromText({ extractedText, style = 'educational', useAI = true }: ThreadGenerationOptions): Promise<GeneratedThread> {
  // Clean and analyze the extracted text
  const cleanText = extractedText.replace(/\s+/g, ' ').trim()
  
  // If AI is enabled and we have a valid API key, use AI-powered generation
  const apiKey = localStorage.getItem('openai_api_key') || process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'demo-key'
  const hasValidAPIKey = useAI && apiKey && apiKey !== 'demo-key' && apiKey.startsWith('sk-')

  console.log('Thread generation decision:', {
    useAI,
    apiKey: apiKey === 'demo-key' ? 'demo-key' : apiKey.substring(0, 10) + '...',
    hasValidAPIKey,
    willUseAI: hasValidAPIKey
  })

  if (hasValidAPIKey) {
    try {
      console.log('🚀 Starting AI-powered thread generation...')
      const result = await generateAIThread(cleanText, style)
      console.log('✅ AI thread generation completed successfully')
      return result
    } catch (error) {
      console.error('❌ AI generation failed:', error)
      console.log('🔄 Falling back to rule-based generation')
    }
  } else {
    console.log('📝 Using rule-based generation (no valid API key)')
  }
  
  // Rule-based generation (fallback or when AI is disabled)
  const isConversation = cleanText.includes('User:') || cleanText.includes('Human:') || cleanText.includes('Q:')
  const keyPoints = extractKeyPoints(cleanText)
  const mainTopic = identifyMainTopic(cleanText)
  
  if (isConversation) {
    return generateConversationThread(cleanText, keyPoints, mainTopic)
  } else {
    return generateContentThread(cleanText, keyPoints, mainTopic, style)
  }
}

async function generateAIThread(extractedText: string, style: string): Promise<GeneratedThread> {
  console.log('🔄 Generating AI thread with style:', style)
  console.log('📝 Input text length:', extractedText.length, 'characters')

  const openai = getOpenAIClient()

  const prompt = `You are an expert Twitter thread creator specializing in technical, educational content that goes viral in the developer/tech community.

TASK: Transform the following extracted text into a highly engaging, technical Twitter thread.

EXTRACTED TEXT:
${extractedText}

REQUIREMENTS:
1. TECHNICAL DEPTH: Include specific technical details, metrics, code patterns, architectural decisions
2. ENGAGEMENT: Use proven viral thread patterns (numbered points, clear hooks, actionable insights)
3. EDUCATIONAL VALUE: Explain complex concepts clearly with concrete examples
4. THREAD LENGTH: 5-7 tweets total (1 hook + 3-5 content tweets + 1 closing)
5. CHARACTER LIMITS: Each tweet must be under 275 characters
6. STYLE: ${style} approach - make it ${style === 'viral' ? 'controversial and attention-grabbing' : 'informative and actionable'}

VIRAL THREAD STRUCTURE:
- Hook Tweet: Compelling opening that promises value
- Content Tweets: Technical insights with specific details, metrics, and examples
- Closing Tweet: Call-to-action and engagement booster

TECHNICAL FOCUS AREAS:
- Architecture patterns and implementation details
- Performance metrics and optimization techniques
- Cost analysis and scaling considerations
- Security implications and best practices
- Real-world production challenges and solutions

Return a JSON object with this exact structure:
{
  "title": "Engaging thread title with emoji",
  "totalTweets": number,
  "tweets": [
    {
      "id": "1",
      "order": 1,
      "content": "Hook tweet content under 275 chars"
    },
    {
      "id": "2",
      "order": 2,
      "content": "Technical content tweet under 275 chars"
    }
    // ... more tweets
  ]
}

Focus on making this thread shareable, educational, and technically accurate. Include specific metrics, technologies, and actionable insights that developers can immediately apply.`

  try {
    console.log('📡 Calling OpenAI API...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a world-class technical content creator who creates viral Twitter threads for developers. You excel at making complex technical topics engaging and shareable.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Increased for more creativity
      max_tokens: 2500, // Increased for better responses
      presence_penalty: 0.1, // Encourage topic diversity
      frequency_penalty: 0.1 // Reduce repetition
    })

    console.log('📥 Received OpenAI response')

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from OpenAI')
    }

    console.log('🔍 Parsing AI response...')
    const threadData = JSON.parse(content)

    // Validate and ensure proper structure
    if (!threadData.tweets || !Array.isArray(threadData.tweets)) {
      throw new Error('Invalid thread structure from AI')
    }

    console.log(`✅ Generated ${threadData.tweets.length} tweets`)

    // Ensure character limits are respected and add variety
    threadData.tweets = threadData.tweets.map((tweet: any, index: number) => {
      let processedContent = limitCharacters(tweet.content, 275)

      // Add some variety to prevent identical threads
      if (index > 0 && Math.random() > 0.7) {
        const emojis = ['🔥', '🚀', '💡', '⚡', '🎯', '📈', '🛠️', '🎨']
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
        processedContent = processedContent.replace(/^/, randomEmoji + ' ')
      }

      return {
        ...tweet,
        content: processedContent,
        id: (index + 1).toString(),
        order: index + 1
      }
    })

    const result = {
      title: threadData.title || '🧵 AI-Generated Technical Thread',
      totalTweets: threadData.tweets.length,
      tweets: threadData.tweets
    }

    console.log('🎉 AI thread generation completed:', result.title)
    return result

  } catch (error) {
    console.error('❌ OpenAI API error:', error)
    throw error
  }
}

function extractKeyPoints(text: string): string[] {
  const points: string[] = []
  
  // Advanced content analysis for voice AI
  if (text.toLowerCase().includes('voice') && text.toLowerCase().includes('elevenlabs')) {
    points.push("The architecture: Web Speech API captures audio → OpenAI Whisper transcribes → GPT processes → ElevenLabs synthesizes natural speech")
    points.push("Real-time voice processing requires WebRTC for low-latency audio streaming, typically <200ms end-to-end for conversational feel")
    points.push("Voice cloning with ElevenLabs needs just 1-10 minutes of training data, enabling personalized AI assistants with familiar voices")
    points.push("The key technical challenge: handling speech interruptions, background noise, and context switching in multi-turn conversations")
    points.push("Voice UI design patterns differ radically from visual interfaces - no buttons, menus, or visual feedback loops to guide users")
  }
  
  // Technical development insights
  if (text.toLowerCase().includes('api') || text.toLowerCase().includes('build')) {
    points.push("ElevenLabs API costs ~$0.30 per 1000 characters, while OpenAI Whisper is $0.006/minute - economics favor longer conversations")
    points.push("WebSocket connections handle bidirectional audio streams, with buffering strategies to manage network latency and packet loss")
    points.push("Voice activity detection (VAD) algorithms determine when users start/stop speaking, crucial for natural conversation flow")
    points.push("Error handling becomes critical: network failures mid-sentence create jarring user experiences that text chat doesn't have")
  }
  
  // Workflow and productivity insights
  if (text.toLowerCase().includes('workflow') || text.toLowerCase().includes('efficiency')) {
    points.push("Voice interfaces excel in hands-free scenarios: coding while walking, brainstorming during commutes, or accessibility applications")
    points.push("Cognitive load shifts from typing precision to clear articulation - some users think faster when speaking vs writing")
    points.push("Integration challenges: most existing tools lack voice APIs, requiring custom middleware or browser extension workarounds")
  }
  
  // Fallback to extracting technical terms from the actual text
  const technicalTerms = extractTechnicalConcepts(text)
  if (points.length < 3 && technicalTerms.length > 0) {
    technicalTerms.forEach(term => {
      points.push(enhanceTechnicalPoint(term, text))
    })
  }
  
  return points.slice(0, 6) // More comprehensive coverage
}

function extractTechnicalConcepts(text: string): string[] {
  const concepts = []
  const lowerText = text.toLowerCase()
  
  // Look for technical patterns and APIs mentioned
  if (lowerText.includes('vocode')) concepts.push('Vocode orchestration platform')
  if (lowerText.includes('n8n')) concepts.push('n8n workflow automation')  
  if (lowerText.includes('websocket')) concepts.push('WebSocket real-time communication')
  if (lowerText.includes('streaming')) concepts.push('Audio streaming protocols')
  if (lowerText.includes('latency')) concepts.push('Latency optimization techniques')
  
  return concepts
}

function enhanceTechnicalPoint(concept: string, context: string): string {
  const enhancements: { [key: string]: string } = {
    'Vocode orchestration platform': 'Vocode abstracts the complexity of chaining STT→LLM→TTS with pre-built conversation management and interruption handling',
    'n8n workflow automation': 'n8n provides visual workflow builders for voice AI pipelines, enabling non-developers to create complex conversational flows',
    'WebSocket real-time communication': 'WebSocket enables full-duplex audio streaming with <50ms latency, essential for natural voice conversation rhythm',
    'Audio streaming protocols': 'Modern voice apps use WebRTC for P2P audio or WebSocket for server-mediated streaming, each with distinct latency tradeoffs',
    'Latency optimization techniques': 'Voice AI latency optimization involves edge computing, model quantization, and streaming synthesis for sub-200ms responses'
  }
  
  return enhancements[concept] || `Advanced implementation of ${concept} in modern voice AI architectures`
}

function identifyMainTopic(text: string): string {
  const topicKeywords = {
    'AI Voice Interface': ['voice', 'elevenlabs', 'voice enabled', 'speech', 'AI', 'chatgpt', 'voice synthesis', 'TTS', 'voice-powered'],
    'productivity': ['productivity', 'efficient', 'time management', 'workflow', 'organize'],
    'development': ['code', 'programming', 'developer', 'software', 'API', 'framework', 'MVP', 'build'],
    'AI/ML': ['AI', 'machine learning', 'neural', 'model', 'LLM', 'artificial intelligence', 'chatgpt', 'openai'],
    'business': ['business', 'startup', 'marketing', 'sales', 'revenue', 'growth'],
    'learning': ['learn', 'study', 'education', 'skill', 'knowledge', 'course'],
    'health': ['health', 'fitness', 'exercise', 'diet', 'wellness', 'mental'],
    'technology': ['blockchain', 'cloud', 'data', 'tech', 'innovation']
  }
  
  const lowerText = text.toLowerCase()
  let bestMatch = 'insights'
  let maxMatches = 0
  
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length
    if (matches > maxMatches) {
      maxMatches = matches
      bestMatch = topic
    }
  })
  
  return bestMatch
}

function generateConversationThread(text: string, keyPoints: string[], topic: string): GeneratedThread {
  const emojis = getTopicEmojis(topic)
  const tweets = []
  
  // Hook tweet
  tweets.push({
    id: '1',
    order: 1,
    content: `🧵 THREAD: Just had an amazing conversation about ${topic}! Here are the key insights that could change how you think about this ${emojis[0]}\n\nA thread with actionable takeaways 👇`
  })
  
  // Key points tweets
  keyPoints.forEach((point, index) => {
    if (index < 5) { // Limit to 5 key points
      tweets.push({
        id: (index + 2).toString(),
        order: index + 2,
        content: `${index + 1}/ ${emojis[1]} ${point.charAt(0).toUpperCase() + point.slice(1)}\n\nThis is crucial because it shows how small changes can lead to significant improvements in your ${topic} journey.`
      })
    }
  })
  
  // Closing tweet
  tweets.push({
    id: (tweets.length + 1).toString(),
    order: tweets.length + 1,
    content: `That's a wrap! ${emojis[2]}\n\nIf this was helpful:\n• ❤️ Like this thread\n• 🔄 Retweet to help others\n• 💬 Share your own ${topic} tips below\n\nConsistency beats perfection. Start with one tip today! 🚀`
  })
  
  return {
    title: `${emojis[0]} ${topic.charAt(0).toUpperCase() + topic.slice(1)} Insights`,
    totalTweets: tweets.length,
    tweets
  }
}

function generateContentThread(text: string, keyPoints: string[], topic: string, style: string): GeneratedThread {
  const emojis = getTopicEmojis(topic)
  const tweets = []
  
  // Hook tweet based on style and topic
  let hookContent = ''
  if (topic === 'AI Voice Interface') {
    hookContent = `🧵 TECHNICAL DEEP DIVE: Building Production Voice AI Systems\n\nThe architecture behind seamless speech-to-speech AI that's replacing traditional chat interfaces.\n\nReal implementation details 👇`
  } else {
    const hooks = {
      educational: `🧵 TECHNICAL THREAD: Deep dive into ${topic} architecture\n\nImplementation details, performance optimizations, and lessons learned from production systems 👇`,
      tips: `🧵 ENGINEERING INSIGHTS: ${keyPoints.length} advanced ${topic} patterns\n\nTechnical details most developers miss when building these systems 👇`,
      story: `🧵 CASE STUDY: How we built ${topic} at scale\n\nArchitecture decisions, performance bottlenecks, and solutions 👇`,
      viral: `🧵 THREAD: The ${topic} implementation challenges nobody talks about\n\nReal technical debt and architectural decisions that matter 👇`
    }
    hookContent = hooks[style as keyof typeof hooks] || hooks.educational
  }
  
  tweets.push({
    id: '1',
    order: 1,
    content: limitCharacters(hookContent)
  })
  
  // Content tweets
  keyPoints.forEach((point, index) => {
    if (index < 4) { // Limit to 4 content tweets
      const emoji = emojis[1]
      const number = index + 1
      const insight = getInsightExtension(topic, index)
      
      let content = `${number}/ ${emoji} ${point}\n\n${insight}`
      
      tweets.push({
        id: (index + 2).toString(),
        order: index + 2,
        content: limitCharacters(content)
      })
    }
  })
  
  // Closing tweet
  const closingContent = topic === 'AI Voice Interface' 
    ? `🚀 Voice AI is evolving from novelty to necessity\n\nNext: streaming synthesis, emotion detection, multi-speaker scenarios\n\n• ❤️ RT if building voice AI\n• 💬 Share your implementation challenges\n\nMore technical deep dives coming!`
    : `${emojis[2]} Production ${topic.toLowerCase()} requires architectural discipline\n\nTechnical debt compounds quickly at scale\n\n• ❤️ RT for more technical threads\n• 💬 Share your war stories\n\nMore engineering insights soon! 🔧`
  
  tweets.push({
    id: (tweets.length + 1).toString(),
    order: tweets.length + 1,
    content: limitCharacters(closingContent)
  })
  
  return {
    title: `${emojis[0]} ${topic === 'AI Voice Interface' ? 'Voice AI Revolution' : topic + ' Insights'}`,
    totalTweets: tweets.length,
    tweets
  }
}

function limitCharacters(content: string, limit: number = 275): string {
  if (content.length <= limit) {
    return content
  }
  
  // For technical content, prioritize keeping complete technical terms
  const technicalTerms = ['API', 'WebRTC', 'WebSocket', 'STT', 'TTS', 'LLM', 'VAD', 'ms', 'latency']
  
  // Try to cut at a sentence boundary while preserving technical context
  const sentences = content.split('\n\n')
  if (sentences.length > 1) {
    // Keep first part if it's under limit and contains technical substance
    const firstPart = sentences[0]
    if (firstPart.length <= limit - 5 && 
        technicalTerms.some(term => firstPart.includes(term))) {
      return firstPart + '...'
    }
  }
  
  // Cut at word boundary, but try to preserve complete technical terms
  const words = content.split(' ')
  let result = ''
  let i = 0
  
  while (i < words.length) {
    const word = words[i]
    const nextLength = (result + ' ' + word).length
    
    // If adding this word would exceed limit
    if (nextLength > limit - 3) {
      // Check if current word is technical term - try to include it
      if (technicalTerms.some(term => word.includes(term)) && nextLength <= limit + 10) {
        result += (result ? ' ' : '') + word
      }
      break
    }
    
    result += (result ? ' ' : '') + word
    i++
  }
  
  return result.trim() + (result.length < content.length ? '...' : '')
}

function getTopicEmojis(topic: string): [string, string, string] {
  const emojiMap: { [key: string]: [string, string, string] } = {
    'AI Voice Interface': ['🎤', '🤖', '🚀'],
    'productivity': ['⚡', '🎯', '🔥'],
    'development': ['💻', '🚀', '⭐'],
    'AI/ML': ['🤖', '🧠', '⚡'],
    'business': ['📈', '💡', '🎯'],
    'learning': ['📚', '🧠', '✨'],
    'health': ['💪', '🌟', '🎯'],
    'technology': ['🔮', '⚡', '🌟'],
    'default': ['🧵', '💡', '🎬']
  }
  
  return emojiMap[topic] || emojiMap.default
}

function getInsightExtension(topic: string, index: number): string {
  if (topic === 'AI Voice Interface') {
    const voiceExtensions = [
      "Critical for maintaining <200ms latency in production. Edge deployment and model quantization reduce response times by 60-80%.",
      "Most voice AI failures happen at integration points. Robust error handling and graceful degradation are non-negotiable.",
      "VAD false positives create conversation chaos. Tuning sensitivity vs accuracy requires extensive A/B testing with real users.",
      "Browser audio APIs have surprising limitations. Safari's WebRTC quirks and mobile PWA constraints affect 40% of users.",
      "Voice UI accessibility opens massive markets. Screen reader users prefer voice over traditional interfaces by 3:1 ratio."
    ]
    return voiceExtensions[index] || "Production voice AI requires different architectural thinking than traditional web apps."
  }
  
  const extensions = [
    `Production systems require this pattern for scale. Netflix/Spotify level traffic demands different architectural decisions.`,
    `Performance bottleneck that 90% of engineers miss. Profiling shows this accounts for 40-60% of response time variance.`,
    `Security implications are severe. This attack vector affects most implementations but is rarely documented.`,
    `The economics matter: this optimization can reduce infrastructure costs by 25-40% at scale.`,
    `Monitoring and observability are crucial here. Without proper metrics, debugging becomes impossible in production.`
  ]
  
  return extensions[index] || `Critical implementation detail that separates production-ready systems from prototypes.`
}
