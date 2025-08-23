# 🧵 ThreadMaker - AI Twitter Thread Generator

Transform your ChatGPT conversations and screenshots into viral Twitter threads with AI-powered content optimization.

## ✨ Features

- **📸 Smart OCR**: Upload screenshots and extract text using advanced OCR technology (Tesseract.js)
- **🤖 AI-Powered Thread Generation**: GPT-4 creates expert-level, technical threads optimized for viral engagement
- **📝 Intelligent Fallback**: Rule-based generation when AI is unavailable
- **📱 Mobile Optimized**: Responsive design that works perfectly on all devices
- **🎯 Viral Optimization**: Built-in strategies for maximum engagement and reach
- **📋 Easy Export**: Copy individual tweets or entire threads with one click
- **⚡ Real-time Preview**: See exactly how your thread will look on Twitter
- **🔧 Configurable AI**: Optional OpenAI integration with local API key storage

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommend using nvm)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ThreadMaker
```

2. Switch to the correct Node version:
```bash
nvm use node
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

6. **(Optional)** For AI-powered threads: Add your OpenAI API key in the configuration panel

## 🎯 How to Use

1. **Upload Screenshot**: Drag and drop or click to upload a screenshot of your ChatGPT conversation
2. **OCR Processing**: The app will automatically extract text from your image using Tesseract.js
3. **Generate Thread**: Click "Generate Thread" to create an optimized Twitter thread
4. **Preview & Edit**: Review your thread with Twitter-like styling
5. **Export**: Copy individual tweets or the entire thread to your clipboard

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Material-UI (MUI) with custom Twitter-like theming
- **OCR**: Tesseract.js for client-side text extraction
- **Styling**: Material-UI with Roboto font
- **Development**: ESLint, TypeScript strict mode

## 📊 Thread Generation Features

- **Smart Content Analysis**: Identifies conversation patterns and key insights
- **Multiple Styles**: Educational, tips, story, and viral thread formats
- **Topic Recognition**: Automatically detects topics (productivity, development, business, etc.)
- **Engagement Optimization**: Built-in hooks, CTAs, and engagement boosters
- **Character Limits**: Ensures all tweets stay within Twitter's 280-character limit

## 🔧 Configuration

### AI-Powered Thread Generation (Optional)

To enable expert-level AI threads:

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click "Configure" in the AI configuration panel
3. Enter your API key (stored locally in browser)
4. Enjoy GPT-4 powered technical threads!

**Cost**: ~$0.01-0.05 per thread generation
**Privacy**: API keys stored locally, never sent to our servers

### Other Configuration Options

- **OCR Language**: Currently set to English (can be extended for other languages)
- **Thread Styles**: Educational, tips, story, viral (default: viral)
- **AI Mode**: Automatic fallback to rule-based generation if no API key
- **Max File Size**: 10MB limit for uploaded images
- **Supported Formats**: PNG, JPG, JPEG

## 📱 Mobile Optimization

- Responsive stepper for progress tracking
- Touch-friendly drag and drop
- Optimized typography for mobile screens
- Fast loading with efficient bundle splitting

## 🎨 UI Features

- **Twitter-like Preview**: See exactly how your thread will appear
- **Progress Tracking**: Real-time OCR progress with status updates
- **Error Handling**: User-friendly error messages and retry options
- **Copy Feedback**: Visual confirmation when content is copied
- **Pro Tips**: Built-in engagement and timing recommendations

## 🚀 Production Deployment

For production deployment:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🔮 Planned Features

- [ ] User authentication and saved threads
- [ ] Payment gating for premium features
- [ ] Multiple language OCR support
- [ ] Thread analytics and performance tracking
- [ ] Custom thread templates
- [ ] Direct Twitter posting integration
- [ ] Batch processing for multiple images

## 🤝 Contributing

This is an MVP focused on core functionality. Future iterations will include user authentication, payment processing, and advanced features.

## 📄 License

MIT License - feel free to use and modify as needed.

---

Built with ❤️ for content creators who want to turn insights into engaging Twitter threads.
