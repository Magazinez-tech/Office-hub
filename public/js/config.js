/* Office Hub: ค่าตั้งของเว็บ
   - supabaseUrl และ supabaseAnonKey มาจาก Supabase > Project Settings > API (สองค่านี้ออกแบบมาให้เปิดเผยได้ ใส่ในหน้าเว็บได้)
   - ห้ามใส่ service_role key หรือ client secret ของ Google / Microsoft ในไฟล์นี้เด็ดขาด
   - ถ้าเว้นว่าง ระบบสมาชิกจะซ่อนไว้ และเว็บใช้ข้อมูลตัวอย่าง (ยกเว้นข่าวและอากาศที่เป็นของจริงเสมอ) */
window.HUB_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',

  // ตำแหน่งสำหรับพยากรณ์อากาศ (Open-Meteo ไม่ต้องใช้ key)
  weather: { city: 'กรุงเทพฯ', lat: 13.75, lon: 100.52 },

  // สิทธิ์ที่ขอเมื่อเชื่อมต่อ (ต้องตรงกับที่เปิดไว้ใน Google Cloud / Microsoft Entra)
  googleScopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/youtube.readonly',
  microsoftScopes: 'openid email profile offline_access User.Read Files.Read'
};
