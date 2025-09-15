# 🌸 AuraFarm - Zen Garden Raking Game

A relaxing pixelated zen garden game where you rake sand patterns while maintaining your aura. Built with React and TypeScript.

## 🎮 How to Play

- **Click and drag** to move the rake through the sand
- Create beautiful patterns in the sand as you rake
- **Avoid** rocks, trees, and ponds - hitting them decreases your aura
- **Gain aura** by continuously raking the sand
- Watch your patterns persist as you create your zen garden

## 🏗️ Tech Stack

- React 18 with TypeScript
- HTML5 Canvas for rendering
- Express.js for production server
- Deployed on Render

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📦 Deployment on Render

### Automatic Deployment

This project includes a `render.yaml` configuration file for easy deployment:

1. Fork/clone this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" and select "Web Service"
4. Connect your GitHub account and select this repository
5. Render will automatically detect the configuration
6. Click "Create Web Service"

### Manual Deployment

If you prefer manual configuration:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Environment**: Node

## 🎨 Features

- **Persistent Rake Patterns**: Your rake marks stay visible on the sand
- **Pixelated Aesthetic**: Retro-style pixel art graphics
- **Zen Color Palette**: Calming sandy browns and natural tones
- **Dynamic Aura System**: Manage your spiritual energy while raking
- **Collision Detection**: Interactive obstacles to avoid
- **Fullscreen Gameplay**: Immersive zen garden experience

## 🎵 Audio

The game includes a lo-fi background track for a relaxing experience. You can mute/unmute using the audio controls in the top-right corner.

## 🛠️ Project Structure

```
aurafarm/
├── src/
│   ├── components/    # React components (GameCanvas, HUD, AudioPlayer)
│   ├── hooks/          # Custom hooks (useGameLoop)
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Game helpers and configuration
│   └── App.tsx         # Main application component
├── public/             # Static assets
├── server.js          # Express server for production
└── render.yaml        # Render deployment configuration
```

## 📝 License

MIT

---

Built with 🤖 [Claude Code](https://claude.ai/code)