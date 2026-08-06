# Dairy Farm

A Node.js + Express + MongoDB multi-vendor ecommerce storefront with admin and client flows, EJS views, Socket.IO notifications, and payment workflow integration.

## Features

- Client storefront and admin dashboard views
- Product catalog, cart, checkout and order flows
- Multi-role auth with seeded admin accounts
- Notifications via Socket.IO
- Receipt generation support via Puppeteer
- Payment and SMS/WhatsApp/email provider hooks

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- EJS templates
- Socket.IO
- Puppeteer
- Nodemailer, Twilio, AfricasTalking, Axios

## Prerequisites

Before running locally, make sure you have:

- Node.js 18+ recommended
- npm
- MongoDB running locally or a reachable MongoDB URI

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file based on [.env.example](.env.example).

3. Start MongoDB.

4. Start the application:

   ```bash
   npm start
   ```

5. Open the app at:

   - Main site: `http://localhost:3000`
   - Admin host fallback: `http://admin.localhost:3000`

## Environment Variables

Use the following variables in your deployment environment:

- `PORT`
- `ADMIN_SUBDOMAIN`
- `MONGO_URI`
- `SESSION_SECRET`
- `COMPANY_NAME`
- `COMPANY_LOGO`
- `COMPANY_ADDRESS`
- `COMPANY_EMAIL`
- `COMPANY_PHONE`
- `COMPANY_WEBSITE`
- `COMPANY_WHATSAPP`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `AT_API_KEY`
- `AT_USERNAME`
- `SMS_FROM`
- `TWILIO_SID`
- `TWILIO_AUTH_TOKEN`
- `WHATSAPP_FROM`

## Production Notes

- Use a managed MongoDB service in production.
- Set the `MONGO_URI` to the deployed database instead of the local fallback.
- The app uses the `start` script in [package.json](package.json) as the production entry point.
- If hosting behind a reverse proxy, configure the `ADMIN_SUBDOMAIN` and DNS host mapping accordingly.

## Project Scripts

- `npm start` – Launch the production server
- `npm run dev` – Start the app in development mode with nodemon

## Deployment Checklist

- [ ] MongoDB reachable from the host
- [ ] Environment variables populated
- [ ] `PORT` exposed in the deployment target
- [ ] Admin hostname configured if subdomain routing is enabled
- [ ] Upload and receipt directories available if needed

## License

ISC
