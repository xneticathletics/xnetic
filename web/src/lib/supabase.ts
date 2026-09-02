import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Tarayıcıda oturum saklama için ekstra bir adaptöre gerek yok —
// supabase-js varsayılan olarak localStorage kullanır (mobildeki
// SecureStore adaptörünün web karşılığı).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
