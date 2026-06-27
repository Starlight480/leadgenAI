export interface Campaign {
  id: string
  name: string | null
  category: string
  city: string
  area: string | null
  status: 'running' | 'paused' | 'completed' | 'failed'
  leads_found: number
  leads_processed: number
  search_query: string | null
  radius_meters: number
  target_count: number
  agent: string
  error: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface Lead {
  id: string
  business_name: string
  category: string
  subcategory: string | null
  city: string
  area: string | null
  address: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  instagram: string | null
  twitter: string | null
  tiktok: string | null
  google_place_id: string | null
  has_website: boolean
  website_url: string | null
  source: 'google_maps' | 'instagram' | 'tiktok' | 'manual' | 'jiji'
  status: 'new' | 'profiled' | 'spec_written' | 'site_built' | 'contacted' | 'interested' | 'closed' | 'dead' | 'failed'
  priority: 'normal' | 'high' | 'urgent'
  lead_type: 'website_build' | 'rental_listing'
  pipeline_stage: 'discovered' | 'profiled' | 'routed' | 'built' | 'outreach_sent' | 'manual_queue' | 'done' | 'failed'
  notes: string | null
  campaign_id: string | null
  created_at: string
  updated_at: string
}

export interface BusinessProfile {
  id: string
  lead_id: string
  business_summary: string | null
  target_audience: string | null
  estimated_size: 'small' | 'medium' | 'large' | null
  existing_digital_presence: {
    instagram: boolean
    facebook: boolean
    google_listing: boolean
  }
  website_pitch: string | null
  recommended_pages: string[]
  color_notes: string | null
  tone_notes: string | null
  price_recommendation_ngn: number | null
  price_recommendation_usd: number | null
  created_at: string
  updated_at: string
}

export interface Spec {
  id: string
  lead_id: string
  profile_id: string | null
  site_type: 'html' | 'nextjs' | 'react'
  pages: Record<string, unknown> | null
  color_palette: Record<string, unknown> | null
  content: Record<string, unknown> | null
  tech_stack: string[] | null
  status: 'draft' | 'approved' | 'in_progress' | 'complete'
  created_at: string
}

export interface Project {
  id: string
  lead_id: string
  spec_id: string | null
  business_name: string
  category: string | null
  status: 'spec_written' | 'approved' | 'in_progress' | 'review' | 'live' | 'cancelled'
  price_ngn: number | null
  price_usd: number | null
  deposit_paid: boolean
  deposit_amount_ngn: number | null
  repo_url: string | null
  live_url: string | null
  staging_url: string | null
  vercel_project_id: string | null
  dev_notes: string | null
  spec_html: string | null
  deployed: boolean
  deploy_url: string | null
  deployed_at: string | null
  created_at: string
  updated_at: string
}

export interface OutreachItem {
  id: string
  lead_id: string
  channel: string
  status: string
  subject: string | null
  message: string
  recipient: string | null
  requires_manual: boolean
  manual_reason: string | null
  sent_at: string | null
  opened_at: string | null
  response_status: string | null
  response_text: string | null
  response_at: string | null
  agent: string | null
  notes: string | null
  created_at: string
}

export interface PipelineEvent {
  id: string
  lead_id: string | null
  campaign_id: string | null
  agent: 'orchestrator' | 'scout' | 'scribe' | 'dev' | 'reach' | 'system'
  event_type: string
  summary: string
  details: Record<string, unknown> | null
  duration_ms: number | null
  success: boolean
  error: string | null
  created_at: string
}

export interface Invoice {
  id: string
  project_id: string | null
  lead_id: string | null
  business_name: string
  amount_ngn: number | null
  amount_usd: number | null
  currency: 'NGN' | 'USD'
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
  sent_at: string | null
  paid_at: string | null
  payment_reference: string | null
  payment_method: 'bank_transfer' | 'paystack' | 'cash' | 'ussd' | null
  notes: string | null
  created_at: string
}

export interface RentNaijaListing {
  id: string
  lead_id: string | null
  title: string
  listing_type: 'apartment' | 'duplex' | 'room' | 'bungalow' | 'office' | 'shop' | 'land' | 'shortlet'
  price_yearly_ngn: number | null
  bedrooms: number | null
  bathrooms: number | null
  location: string
  area: string | null
  city: string
  description: string | null
  amenities: string[] | null
  landlord_name: string | null
  landlord_phone: string | null
  landlord_whatsapp: string | null
  source_platform: string
  source_url: string | null
  pushed_to_rentnaija: boolean
  rentnaija_listing_id: string | null
  pushed_at: string | null
  created_at: string
}

export interface FollowUp {
  id: string
  lead_id: string
  type: string
  due_date: string
  status: "pending" | "completed" | "skipped"
  notes: string | null
  created_at: string
}

export interface EmailTemplate {
  id: string
  category: string
  name: string
  subject: string
  body: string
  is_active: boolean
  created_at: string
}
