import 'react-native-url-polyfill/auto'
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from "@react-native-async-storage/async-storage";
import _default from '@expo/vector-icons/build/Entypo';

export default supabase = createClient("https://tdpwhgbmrromwriykftk.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcHdoZ2JtcnJvbXdyaXlrZnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDcwNzUsImV4cCI6MjA1OTA4MzA3NX0.cgil-h7vZ-HpUimweze9TGDC3guJGgJpR3nhCTdmwaU", {
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
