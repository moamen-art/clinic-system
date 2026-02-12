import { createClient } from '@supabase/supabase-js'

// عنوان المشروع (من الصورة)
const supabaseUrl = 'https://zbmpztdbhixthiwvriuw.supabase.co'

// مفتاح الربط (انسخه من الخانة اللي تحتها في الموقع عندك)
const supabaseKey = 'sb_publishable_375nNjmvIrDHbEQDk0oM_Q_IahSJTSQ';

export const supabase = createClient(supabaseUrl, supabaseKey)