
# MedusaXD Web Browser

A powerful virtual web browser platform built with advanced cloud technology.

## Features

- 🚀 **Fast Virtual Browsing**: Lightning-fast browser sessions
- 🔒 **Secure**: Enterprise-grade security and privacy
- 📱 **Multi-Device**: Desktop and mobile browser emulation
- 🌐 **Universal Access**: Access any website globally
- ⚡ **Real-time**: Instant response and interaction

## Deployment on Render

1. **Fork this repository**
2. **Connect to Render**: Link your GitHub repository
3. **Set Environment Variables**:
   - `MEDUSAXD_API_KEY`: Your API key
4. **Deploy**: Render will automatically build and deploy

## Environment Variables

```bash
MEDUSAXD_API_KEY=your_api_key_here
NODE_ENV=production
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## API Endpoints

- `POST /api/create-session` - Create new browser session
- `GET /api/session/:id` - Get session status
- `DELETE /api/session/:id` - Terminate session
- `GET /api/sessions` - List active sessions

## Security Features

- Rate limiting
- CORS protection
- Helmet security headers
- Environment variable protection
- Input validation

## Support

For technical support, please contact the development team.

