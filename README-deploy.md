# TaskFlow Pro - Deployment Guide

A clean dark-themed task manager that lets users add, complete, delete, and filter tasks by priority and status using localStorage for persistence.

## Prerequisites

- **For Docker deployment**: Docker and Docker Compose installed
- **For manual deployment**: A web server (nginx, Apache, etc.) or static hosting service
- **For development**: Node.js 18+ (optional, for running tests)

## Deploy with Docker

### Build and run the container:

```bash
# Build the Docker image
docker build -t taskflow-pro .

# Run the container
docker run -d -p 8080:80 --name taskflow-pro taskflow-pro
```

The app will be available at http://localhost:8080

## Deploy with Docker Compose

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The app will be available at http://localhost:8080

## Deploy to Static Hosting Services

### Netlify
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Netlify
3. Set build command to empty (no build needed)
4. Set publish directory to `.` (current directory)
5. Deploy!

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts (choose "Other" for framework)
4. Deploy with `vercel --prod`

### GitHub Pages
1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose `main` branch and `/` (root) folder
5. Save and wait for deployment

## Environment Variables

This is a static application with no backend, so no environment variables are required. If you later decide to add a Supabase backend, you would need to set:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Testing Before Deployment

If you want to run the test suite before deployment:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Migrations

No database migrations are required since this app uses localStorage for persistence. All data is stored in the user's browser.

## Troubleshooting

### Docker container won't start
- Check if port 8080 is already in use: `docker ps`
- Use a different port: `docker run -d -p 8081:80 --name taskflow-pro taskflow-pro`

### App doesn't load in browser
- Clear browser cache and reload
- Check browser console for errors
- Verify Docker container is running: `docker ps`

### LocalStorage not persisting
- Ensure cookies/localStorage are enabled in browser
- Try in incognito/private mode to rule out extensions
- Check browser storage limits

## Maintenance

### Update the application
```bash
# Pull latest code
git pull origin main

# Rebuild Docker image
docker-compose build

# Restart containers
docker-compose up -d
```

### View application logs
```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f taskflow-pro
```

### Backup considerations
Since this app uses localStorage, user data is stored in their browser. No server-side backups are needed. If you add a backend later, implement appropriate backup strategies for your database.