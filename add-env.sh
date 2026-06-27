#!/bin/bash
cd ~/leadgen-os
# Add the service role key to Vercel production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --force
