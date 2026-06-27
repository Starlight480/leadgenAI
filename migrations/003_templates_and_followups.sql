-- Migration 003: Email Templates and Follow-up Reminders
-- Run this against your Supabase database

-- ============================================================
-- 1. Email Templates Table
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- ============================================================
-- 2. Follow-ups Table
-- ============================================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'email_followup',
  due_date timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);

-- ============================================================
-- 3. Default Email Templates (one per category)
-- ============================================================
-- Template variables: {{business_name}}, {{city}}, {{category}}, {{sender_name}}

INSERT INTO email_templates (category, name, subject, body, is_active) VALUES

-- Restaurant
('restaurant',
 'Restaurant Website Intro',
 'Quick website idea for {{business_name}} in {{city}}',
 E'Hi there,

I came across {{business_name}} and love what you''re doing with your restaurant in {{city}}.

I help restaurants like yours build simple, beautiful websites that showcase your menu, attract more customers, and make it easy for people to find you online. Think: a clean page with your menu, location, opening hours, and a way for customers to place orders or make reservations.

No complicated setup — I handle everything.

Would you love to see a quick mockup of what your site could look like?

Best,
{{sender_name}}',
 true),

-- Salon
('salon',
 'Salon Booking & Portfolio Site',
 'A simple booking site for {{business_name}} in {{city}}',
 E'Hi there,

I came across {{business_name}} and noticed you don''t have a website yet. That''s a missed opportunity!

I build simple, elegant websites for salons that let clients browse your portfolio, see before/after photos, and book appointments online — all in one clean page.

It''s the kind of site that makes you look professional and keeps clients coming back.

Can I show you a quick mockup? No commitment, just a visual of what''s possible.

Best,
{{sender_name}}',
 true),

-- Barbershop
('barbershop',
 'Barbershop Portfolio & Walk-ins',
 'A website to get more walk-ins for {{business_name}}',
 E'Hey,

I saw {{business_name}} and thought — a simple website could bring in way more walk-ins.

I build clean portfolio sites for barbershops that show your best cuts, your location on a map, and make it dead simple for new clients to find you. Think Instagram-style gallery meets Google Maps.

Easy to update, no tech skills needed.

Want me to mock something up for you? It takes 5 minutes.

— {{sender_name}}',
 true),

-- Hotel
('hotel',
 'Hotel Online Presence',
 'Online presence upgrade for {{business_name}} in {{city}}',
 E'Hello,

I noticed {{business_name}} in {{city}} could benefit from a stronger online presence.

I build simple, professional websites for hotels that showcase rooms, amenities, pricing, and let guests book directly — no middleman taking a cut.

A clean site with great photos can make a huge difference in direct bookings.

Would you like to see what your website could look like?

Best regards,
{{sender_name}}',
 true),

-- Pharmacy
('pharmacy',
 'Pharmacy Information Site',
 'Simple website for {{business_name}} in {{city}}',
 E'Hi,

I noticed {{business_name}} doesn''t have a website yet. I build simple, clean sites for pharmacies that show your location, hours, services, and help customers find you easily on Google.

It''s the kind of professional online presence that builds trust with customers.

Can I send you a quick mockup?

Best,
{{sender_name}}',
 true),

-- Church
('church',
 'Church Community Website',
 'Community website for {{business_name}} in {{city}}',
 E'Hello,

I came across {{business_name}} and thought a simple community website could really help you connect with your congregation and reach new members.

I build clean, welcoming church websites with service times, location, events, and ways for visitors to get involved — all in one place.

Would you like to see a mockup of what this could look like?

Blessings,
{{sender_name}}',
 true),

-- General / Supermarket / Other
('supermarket',
 'Business Online Presence',
 'Online presence for {{business_name}} in {{city}}',
 E'Hi there,

I came across {{business_name}} and noticed you don''t have a website yet. I help local businesses build simple, professional websites that show up on Google and make it easy for customers to find you.

A clean site with your hours, location, products/services, and contact info — nothing fancy, just effective.

Can I show you a quick mockup? Takes 5 minutes.

Best,
{{sender_name}}',
 true)

ON CONFLICT DO NOTHING;
