# AuraFarm - Zen Garden Raking Game

A pixelated zen garden game where you rake sand patterns while avoiding obstacles to maintain your aura.

## Features

- Pixelated zen garden aesthetic
- Dynamic sand raking patterns
- Obstacle avoidance (rocks, trees, ponds)
- Aura system - hitting obstacles reduces your aura
- Auto-resetting sand patterns for continuous play
- Lo-fi background music
- No levels - just pure zen gameplay

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run production server locally
npm run start:prod
```

## Deployment to Render

1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Render will automatically detect the `render.yaml` configuration
4. The app will build and deploy automatically

Or manually deploy:
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

## How to Play

- Click and drag to move the rake through the sand
- Create beautiful patterns as you rake
- Avoid hitting rocks, trees, and ponds
- Hitting obstacles reduces your aura
- When aura reaches 0, the game ends
- Click "Find Inner Peace Again" to restart

## Technologies

- React with TypeScript
- HTML5 Canvas for rendering
- Express.js for production server
- Deployed on Render
