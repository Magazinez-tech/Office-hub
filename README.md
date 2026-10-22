# Office Hub

เว็บแอปที่ใช้ห้องออฟฟิศจิ๋ว 3D เป็นหน้าหลัก สิ่งของแต่ละชิ้นในห้องคือทางเข้าของแต่ละบริการ และมีผู้ช่วย (ตัวละคร) คอยพูดสรุปให้ฟัง

| สิ่งของในห้อง | บริการ | ข้อมูล |
|---|---|---|
| แล็ปท็อปบนโต๊ะ | Gmail | **ของจริง** เมื่อเข้าสู่ระบบด้วย Google: อ่านกล่องจดหมาย, เปิดอ่านอีเมล, ตอบกลับ/ส่งต่อ/เขียนใหม่ (ส่งจริง) |
| ชั้นหนังสือ | OneDrive | **ของจริง** เมื่อเชื่อม Microsoft: พื้นที่ที่ใช้, โฟลเดอร์, ไฟล์ล่าสุด (กดแล้วเปิดใน OneDrive) |
| มือถือบนโต๊ะ | LINE | **ข้อมูลตัวอย่างเสมอ** เพราะ LINE ไม่เปิด API ให้อ่านแชทส่วนตัว |
| บอร์ดโน้ต | ข่าว | **ของจริงเสมอ** ข่าวภาษาไทยจาก Google News 5 หมวด + อากาศจาก Open-Meteo |
| ทีวีบนผนัง | YouTube | **ของจริง** เมื่อเข้าสู่ระบบด้วย Google: วิดีโอใหม่จากช่องที่ติดตาม เล่นได้ในแผง |

> ถ้ายังไม่เข้าสู่ระบบ (หรือยังไม่ได้ตั้งค่า Supabase) Gmail, OneDrive และ YouTube จะแสดงข้อมูลตัวอย่าง

## วิธีเปิดดูในเครื่อง

เปิด Terminal ในโฟลเดอร์นี้แล้วรัน (บน PowerShell ของเครื่องนี้ใช้ `npm.cmd` แทน `npm`)

```bash
npm run dev:full
```

คำสั่งนี้ใช้ Netlify Dev ซึ่งรันฟังก์ชันข่าว (`/api/news`) ด้วย ถ้าใช้ `npm run dev` (เปิดไฟล์อย่างเดียว) ข่าวจะเป็นข้อมูลตัวอย่าง

## ขึ้นเว็บจริง (Netlify หรือ Cloudflare)

เว็บนี้เป็นไฟล์ static ล้วน **ไม่มีขั้นตอน build** ไฟล์ที่ขึ้นเว็บทั้งหมดอยู่ในโฟลเดอร์ `public/` และใช้ได้ทั้งสองเจ้าโดยไม่ต้องแก้อะไร

### Netlify

เลือกวิธีใดวิธีหนึ่ง:

1. **ลากวาง (ง่ายสุด):** เข้า https://app.netlify.com/drop แล้วลากโฟลเดอร์ `public` ไปวาง ได้ลิงก์ `xxx.netlify.app` ทันที
2. **ผ่าน GitHub (อัปเดตอัตโนมัติทุกครั้งที่ push):** อัปโฟลเดอร์ `office-hub` ขึ้น GitHub แล้วใน Netlify เลือก Add new site > Import an existing project ระบบจะอ่าน `netlify.toml` เอง (publish = `public`, ไม่มี build command)
3. **คำสั่ง:** รัน `npm run deploy:netlify` (ครั้งแรกจะให้ล็อกอินและเลือกเว็บไซต์)

### Cloudflare Pages

เลือกวิธีใดวิธีหนึ่ง:

1. **อัปโหลดไฟล์:** Cloudflare Dashboard > Workers & Pages > Create > Pages > Upload assets แล้วเลือกโฟลเดอร์ `public`
2. **ผ่าน GitHub:** Create > Pages > Connect to Git เลือก repo แล้วตั้งค่า
   - Framework preset: `None`
   - Build command: เว้นว่าง
   - Build output directory: `public`
3. **คำสั่ง:** รัน `npm run deploy:cloudflare` (ใช้ค่าจาก `wrangler.toml` ครั้งแรกจะให้ล็อกอินและสร้างโปรเจกต์ ได้ลิงก์ `office-hub.pages.dev`)

### ใช้โดเมนของตัวเอง

- **โฮสต์บน Cloudflare Pages:** ในโปรเจกต์ไปที่ Custom domains > Set up a custom domain ถ้าโดเมนอยู่ใน Cloudflare อยู่แล้ว ระบบจะตั้ง DNS ให้เอง
- **โดเมนอยู่ที่ Cloudflare แต่โฮสต์บน Netlify:** ใน Netlify ไปที่ Domain management > Add a domain แล้วไปที่ Cloudflare DNS เพิ่มระเบียน `CNAME` ชี้ไปที่ `<ชื่อเว็บ>.netlify.app` ตั้งเป็น **DNS only (เมฆสีเทา)** ตามที่ Netlify แนะนำ เพื่อให้ Netlify ออกใบรับรอง HTTPS ได้
- เลือกโฮสต์เจ้าเดียวเป็นเว็บหลักจะดูแลง่ายกว่า อีกเจ้าใช้เป็นเว็บทดสอบได้

### สิ่งที่ตั้งไว้ให้แล้ว

| ไฟล์ | ทำอะไร |
|---|---|
| `public/_headers` | header ความปลอดภัย (CSP, nosniff, referrer, permissions) และให้ three.js เก็บแคชได้ 1 ปี ทั้ง Netlify และ Cloudflare อ่านไฟล์นี้ |
| `public/404.html` | หน้าแจ้งว่าไม่พบหน้า ใช้ได้ทั้งสองเจ้า |
| `public/favicon.svg` | ไอคอนบนแท็บ |
| `netlify.toml` | บอก Netlify ว่าเว็บอยู่ในโฟลเดอร์ `public` |
| `wrangler.toml` | บอก Cloudflare Pages ว่าเว็บอยู่ในโฟลเดอร์ `public` และชื่อโปรเจกต์ |
| `package.json` | คำสั่ง `dev`, `deploy:netlify`, `deploy:cloudflare` |

**หมายเหตุ**
- ถ้าเพิ่มสคริปต์หรือฟอนต์จากเว็บอื่นภายหลัง ต้องเพิ่มโดเมนนั้นใน `Content-Security-Policy` ใน `public/_headers` ด้วย ไม่อย่างนั้นเบราว์เซอร์จะบล็อก
- รูปตัวอย่างตอนแชร์ลิงก์ (`og:image`) ยังไม่ได้ใส่ เพราะต้องใช้ URL เต็มของโดเมนจริง ใส่ใน `<head>` ของ `public/index.html` ได้เมื่อรู้โดเมนแล้ว
- เว็บนี้ยังเป็น mockup ข้อมูลทั้งหมดเป็นข้อมูลสมมติ ถ้าขึ้นเว็บสาธารณะ ใครก็เข้ามาดูได้

## วิธีใช้งาน

- **เปิดแอป:** คลิกสิ่งของในห้อง, ป้ายลอยเหนือสิ่งของ, ปุ่มในแถบด้านล่าง หรือชิปสรุปบนการ์ดซ้ายบน ก็ได้ กล้องจะเลื่อนไปที่สิ่งของนั้น และแผงจะเปิดด้านขวา (บนมือถือเปิดจากด้านล่าง)
- **การเชื่อมต่อ:** ปุ่มขวาบน ใช้เปิด/ปิดการเชื่อมต่อแต่ละบริการ ค่าเริ่มต้นคือ OneDrive ยังไม่เชื่อมต่อ เพื่อให้เห็นขั้นตอนเชื่อมต่อ
- **ผู้ช่วย:** แต่งตัวได้เหมือนออฟฟิศจิ๋ว (เพศ, ผม, ชุด) คลิกที่ตัวละครเพื่อฟังสรุปงานวันนี้
- **กลางวัน/กลางคืน** และ **มุมกล้องเริ่มต้น** อยู่ที่แถบขวาบน
- กด `Esc` เพื่อปิดแผงหรือหน้าต่าง

สถานะการเชื่อมต่อและอีเมล/แชทที่อ่านแล้ว จะจำไว้ในเบราว์เซอร์ (localStorage คีย์ `office-hub-state`) ถ้าอยากเริ่มใหม่ ให้ลบคีย์นี้

## ใช้กับ Claude in Chrome

[Claude in Chrome](https://support.claude.com/en/articles/12012173) (extension ของ Anthropic ใช้ได้กับแพ็กเกจแบบเสียเงิน รวมถึง Pro) อ่านและกดใช้งาน Office Hub ได้ ใช้โควตาบัญชี Claude ของคุณ ไม่ต้องมี API key

1. เปิด Office Hub ผ่าน `npm run dev` (หรือเว็บที่ขึ้นบน Netlify / Cloudflare แล้ว) ใน Chrome แล้วเปิดแผง Claude ด้านข้าง
2. ลองสั่ง เช่น
   - "สรุปอีเมลที่ยังไม่อ่านในหน้านี้"
   - "แชท LINE ไหนที่ยังไม่ได้ตอบ"
   - "เปิดแชทกลุ่มทีมออกแบบ แล้วพิมพ์ตอบว่าเดี๋ยวดูไฟล์ให้"
   - "มีข่าวเทคโนโลยีอะไรบ้าง สรุปสั้นๆ"
   - "เล่นวิดีโอยืดเส้นที่โต๊ะทำงานบนทีวี"

สิ่งที่ช่วยให้ Claude ใช้งานได้ง่าย:

| ส่วน | ทำอะไร |
|---|---|
| ข้อความสรุปที่ซ่อนอยู่ (`#digest`) | มองไม่เห็นบนจอ แต่มีข้อมูลทุกบริการเป็นข้อความ Claude อ่านแล้วตอบได้ทันทีโดยไม่ต้องเปิดทีละแผง (โปรแกรมอ่านหน้าจอก็ใช้ได้) |
| ปุ่ม "ภาพรวม" | แผงรวมทุกอย่างเป็นข้อความ พร้อมปุ่มชื่อชัดเจน เช่น "เปิดอีเมล: สรุปผลแคมเปญเดือนตุลาคม" |
| ลิงก์ `#` | `#overview`, `#gmail`, `#onedrive`, `#line`, `#news`, `#youtube` เปิดแผงนั้นทันที |
| ชื่อแท็บ | บอกจำนวนรายการใหม่และแผงที่เปิดอยู่ เช่น `(5) LINE · Office Hub` |
| ชื่อปุ่ม | ปุ่มในแถบแอปและป้ายในห้องบอกจำนวนรายการใหม่ เช่น "เปิด Gmail (3 รายการใหม่)" |
| กล่องคำพูดผู้ช่วย | เป็น live region จึงอ่านได้ว่าผู้ช่วยในห้องพูดอะไร |

ข้อจำกัด: ห้อง 3D เป็นภาพ Claude อ่านไม่ได้ ใช้แผงและปุ่มแทน ส่วนการส่งข้อความหรืออีเมล Claude in Chrome จะขออนุญาตคุณก่อนกดส่งเสมอ

## โครงสร้างไฟล์

```
office-hub/
├── public/                 ทุกไฟล์ในนี้คือสิ่งที่ขึ้นเว็บ
│   ├── index.html          โครงหน้า: การ์ดสรุป, เครื่องมือ, แถบแอป, แผง, หน้าต่างการเชื่อมต่อ
│   ├── 404.html            หน้าไม่พบ
│   ├── favicon.svg         ไอคอน
│   ├── _headers            header ความปลอดภัยและแคช (Netlify + Cloudflare)
│   ├── css/style.css       สไตล์ทั้งหมด (ตัวแปรสีอยู่บนสุดใน :root รองรับธีมมืด)
│   ├── js/config.js        ค่าตั้ง: Supabase URL / anon key, ตำแหน่งอากาศ, สิทธิ์ที่ขอ
│   ├── js/auth.js          ระบบสมาชิก (Supabase): สมัคร, เข้าสู่ระบบ, Google, Microsoft
│   ├── js/live.js          ดึงข้อมูลจริง: Gmail, YouTube, OneDrive, ข่าว, อากาศ
│   ├── js/scene.js         ฉาก 3D (ห้อง, มือถือ, ทีวี, จุดคลิก, การเลื่อนกล้อง)
│   ├── js/data.js          ข้อมูลตัวอย่าง (ใช้ตอนยังไม่เข้าสู่ระบบ)
│   ├── js/app.js           ตรรกะของแอป: แถบแอป, ป้าย, แผง, ภาพรวม, บัญชี, การเชื่อมต่อ
│   └── vendor/             three.js r147 และ supabase-js 2.45.4 (เก็บไว้ในเครื่อง)
├── netlify/functions/news.mjs   ฟังก์ชันข่าวสำหรับ Netlify (/api/news)
├── functions/api/news.js        ฟังก์ชันข่าวสำหรับ Cloudflare Pages (/api/news)
├── netlify.toml            ตั้งค่า Netlify
├── wrangler.toml           ตั้งค่า Cloudflare Pages
├── package.json            คำสั่ง dev / deploy
└── README.md
```

### `scene.js` เปิด API ให้ `app.js` ใช้ผ่าน `window.OfficeScene`

| คำสั่ง | ทำอะไร |
|---|---|
| `on('pick', fn)` | เมื่อคลิกสิ่งของในห้อง ได้ชื่อบริการ เช่น `'gmail'` |
| `on('hover', fn)` / `on('frame', fn)` | เมาส์ชี้สิ่งของ / ทุกเฟรม (ใช้วางป้าย) |
| `focus(id)` / `focus(null)` | เลื่อนกล้องไปที่สิ่งของ / กลับมุมเดิม |
| `setViewShift(x, y)` | เลื่อนภาพหลบแผงที่เปิดอยู่ |
| `screenPos(id)` | ตำแหน่งบนจอของสิ่งของ |
| `say(text)` | ให้ผู้ช่วยพูด |
| `playVideo({title, channel, colors})` / `playVideo(null)` | เล่น/หยุดวิดีโอบนทีวี |
| `setPhoneUnread(n)` | ตัวเลขแจ้งเตือนบนจอมือถือ |
| `getLook()` | ลุคปัจจุบันของผู้ช่วย (ใช้เลือกคำลงท้าย ค่ะ/ครับ) |

ตำแหน่งกล้องและป้ายของแต่ละสิ่งของ ปรับได้ที่ `const HOTSPOTS` ใน `scene.js`

## เปิดระบบสมาชิกและเชื่อมบัญชีจริง

ข่าวและอากาศใช้ได้ทันทีโดยไม่ต้องตั้งค่า ส่วนการสมัครสมาชิก การเข้าสู่ระบบ Gmail, YouTube และ OneDrive ต้องตั้งค่า 3 ที่ (ทำครั้งเดียว ประมาณ 30–45 นาที)

> **สำคัญ:** client secret ของ Google และ Microsoft ใส่ใน Supabase เท่านั้น ห้ามใส่ในโค้ดหรือส่งให้ใคร สิ่งเดียวที่ใส่ในเว็บได้คือ **Project URL** และ **anon public key** ของ Supabase

### ขั้นที่ 1: Supabase (ระบบสมาชิก, ฟรี)

1. สมัครที่ https://supabase.com แล้วสร้างโปรเจกต์ใหม่ (เลือก region Singapore)
2. **Project Settings > API** คัดลอก `Project URL` และ `anon public` key ไปใส่ใน `public/js/config.js`
3. **Authentication > URL Configuration**
   - Site URL: `https://bigmax.netlify.app`
   - Redirect URLs: เพิ่ม `https://bigmax.netlify.app/**` และ `http://localhost:8888/**`
4. **Authentication > Sign In / Providers**
   - Email: เปิดไว้ (ค่าเริ่มต้นจะส่งอีเมลยืนยันตอนสมัคร)
   - เปิด **Allow manual linking** เพื่อให้คนที่สมัครด้วยอีเมลเชื่อม Google / Microsoft เพิ่มได้

### ขั้นที่ 2: Google (Gmail + YouTube)

1. https://console.cloud.google.com สร้างโปรเจกต์ใหม่
2. **APIs & Services > Library** เปิด **Gmail API** และ **YouTube Data API v3**
3. **OAuth consent screen** (หรือ Google Auth Platform): User type = External, ใส่ชื่อแอปและอีเมล
   - Scopes: `gmail.readonly`, `gmail.send`, `youtube.readonly`
   - **Test users:** ใส่ Gmail ของคนที่จะใช้ (ช่วงทดสอบใช้ได้สูงสุด 100 คน)
4. **Credentials > Create credentials > OAuth client ID** ชนิด Web application
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (ดูได้จากหน้า Google provider ใน Supabase)
5. นำ Client ID และ Client secret ไปใส่ที่ Supabase **Authentication > Providers > Google** แล้วเปิดใช้

Gmail เป็นข้อมูลอ่อนไหว Google จึงแสดงหน้า "แอปยังไม่ได้รับการยืนยัน" ระหว่างทดสอบ (กด ขั้นสูง > ไปต่อ ได้) ถ้าจะเปิดให้คนทั่วไปใช้ ต้องส่งแอปให้ Google ตรวจสอบ (verification) ก่อน

### ขั้นที่ 3: Microsoft (OneDrive)

1. https://portal.azure.com > **Microsoft Entra ID > App registrations > New registration**
   - Supported account types: บัญชีองค์กรใดก็ได้ และบัญชี Microsoft ส่วนตัว
   - Redirect URI (Web): `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Certificates & secrets > New client secret** คัดลอกค่า Value
3. **API permissions > Microsoft Graph > Delegated**: `User.Read`, `Files.Read`, `offline_access`, `email`
4. ใส่ Application (client) ID และ secret ใน Supabase **Providers > Azure** ช่อง Azure Tenant URL ใส่ `https://login.microsoftonline.com/common`

### ขั้นที่ 4: ขึ้นเว็บ

ใส่ค่าใน `public/js/config.js` แล้ว commit + deploy ปุ่ม "เข้าสู่ระบบ" จะขึ้นที่มุมขวาบนเอง

### ข้อควรรู้

- token ของ Google / Microsoft เก็บในเบราว์เซอร์และใช้ได้ราว 1 ชั่วโมง พอหมดอายุ แผงจะขึ้นปุ่ม "เชื่อมต่อ" ให้กดเชื่อมใหม่ ถ้าอยากให้ต่ออายุเองต้องเพิ่ม backend ที่เก็บ refresh token
- อีเมลที่เปิดอ่านจะไม่ถูกทำเครื่องหมายว่าอ่านแล้วใน Gmail จริง (ขอสิทธิ์อ่านอย่างเดียว)
- LINE ไม่มี API สำหรับอ่านแชทส่วนตัว ถ้าจะทำของจริงต้องเป็น LINE Official Account (Messaging API) ของร้านหรือบริษัท
- ฟังก์ชันข่าวมีสองชุดเหมือนกัน: `netlify/functions/news.mjs` และ `functions/api/news.js` แก้แล้วต้องแก้ทั้งสองไฟล์
