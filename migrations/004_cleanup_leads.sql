-- Migration 004: Clean up business names and recategorize leads
-- Run this in Supabase SQL Editor

-- 1. Clean business names: remove Instagram/Facebook junk
UPDATE leads SET business_name = regexp_replace(business_name, '\s*[-|·]\s*Instagram\s*(photos?\s*and\s*videos?)?$', '', 'i');
UPDATE leads SET business_name = regexp_replace(business_name, '\s*[-|·]\s*Facebook\s*(page|profile|photos?)?$', '', 'i');
UPDATE leads SET business_name = regexp_replace(business_name, '\s*[-|·]\s*TikTok\s*(video|profile)?$', '', 'i');
UPDATE leads SET business_name = regexp_replace(business_name, '\s*·\s*(Lagos|Abuja|Nigeria|Ajah|Lekki|Victoria Island|Port Harcourt).*$', '', 'i');
UPDATE leads SET business_name = regexp_replace(business_name, '\s*\(@[\w.]+\)', '', 'i');
UPDATE leads SET business_name = regexp_replace(business_name, '^\s*[-–—·|]+', '', 'i');
UPDATE leads SET business_name = regexp_replace(business_name, '\s*[-–—·|]+$', '', 'i');

-- 2. Remove junk leads (just "Instagram", "Facebook", etc)
DELETE FROM leads WHERE lower(business_name) IN ('instagram', 'facebook', 'tiktok', 'twitter');
DELETE FROM leads WHERE length(business_name) < 3;

-- 3. Recategorize based on keywords
-- Barbershop
UPDATE leads SET category = 'barbershop' WHERE
  lower(business_name) ~ '(barber|barbershop|barbing|haircut|fade|lineup|clipper|taper)' OR
  lower(notes) ~ '(barber|barbershop|barbing)';

-- Salon (hair/beauty, NOT barbers)
UPDATE leads SET category = 'salon' WHERE
  (lower(business_name) ~ '(salon|hairdress|hairstylist|braid|twist|loc|weave|wig|nail|pedicure|manicure|facial|beauty|spa|cosmetic|makeup|lash|brow)' OR
   lower(notes) ~ '(salon|hair|beauty|nail)') AND
  lower(business_name) !~ '(barber|barbing|haircut|fade|clipper)';

-- Restaurant
UPDATE leads SET category = 'restaurant' WHERE
  lower(business_name) ~ '(restaurant|cafe|kitchen|grill|lounge|bistro|food|eatery|chops|bakery)' OR
  lower(notes) ~ '(restaurant|cafe|food|kitchen)';

-- Hotel
UPDATE leads SET category = 'hotel' WHERE
  lower(business_name) ~ '(hotel|motel|inn|resort|lodge|guest\s*house|shortlet)' OR
  lower(notes) ~ '(hotel|resort|shortlet)';

-- Pharmacy
UPDATE leads SET category = 'pharmacy' WHERE
  lower(business_name) ~ '(pharmacy|chemist|drugstore|medical|clinic|hospital)' OR
  lower(notes) ~ '(pharmacy|clinic|medical)';

-- Church
UPDATE leads SET category = 'church' WHERE
  lower(business_name) ~ '(church|mosque|temple|cathedral|parish|ministry)' OR
  lower(notes) ~ '(church|mosque|worship)';

-- Supermarket
UPDATE leads SET category = 'supermarket' WHERE
  lower(business_name) ~ '(supermarket|grocery|store|shop|market|mart|boutique|fashion)' OR
  lower(notes) ~ '(supermarket|store|shop|market)';

-- 4. Report results
SELECT category, count(*) as count FROM leads GROUP BY category ORDER BY count DESC;
