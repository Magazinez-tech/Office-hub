/* Office Hub: ข้อมูลตัวอย่างสำหรับ mockup (ชื่อคน อีเมล ข่าว และวิดีโอทั้งหมดเป็นข้อมูลสมมติ)
   เวอร์ชันจริงให้แทนที่ส่วนนี้ด้วยข้อมูลจาก API ของแต่ละบริการ */
window.HUB_DATA = {
  services: [
    { id: 'gmail',    name: 'Gmail',    short: 'อีเมล',  color: '#ff7a6b', provider: 'Google',    object: 'แล็ปท็อปบนโต๊ะ', desc: 'อ่าน ตอบ และเขียนอีเมล เห็นอีเมลสำคัญของวันนี้' },
    { id: 'onedrive', name: 'OneDrive', short: 'ไฟล์',   color: '#4f95ff', provider: 'Microsoft', object: 'ชั้นหนังสือ',     desc: 'เปิดไฟล์งาน ดูไฟล์ล่าสุด และพื้นที่ที่ใช้ไป' },
    { id: 'line',     name: 'LINE',     short: 'แชท',    color: '#2fc46b', provider: 'LINE',      object: 'มือถือบนโต๊ะ',    desc: 'อ่านแชทกลุ่มและแชทส่วนตัว ตอบข้อความได้ทันที' },
    { id: 'news',     name: 'ข่าว',      short: 'ข่าว',   color: '#9b7bff', provider: 'แหล่งข่าวที่คุณเลือก', object: 'บอร์ดโน้ต', desc: 'สรุปข่าวตามหมวดที่สนใจ พร้อมสภาพอากาศวันนี้' },
    { id: 'youtube',  name: 'YouTube',  short: 'วิดีโอ', color: '#ff5476', provider: 'Google',    object: 'ทีวีบนผนัง',      desc: 'ดูวิดีโอใหม่จากช่องที่ติดตาม เล่นบนทีวีในห้อง' }
  ],

  emails: [
    { id: 1, from: 'ทีมการตลาด', initial: 'ต', color: '#ffd1dc', addr: 'marketing@example.com', time: '10:24', unread: true, label: 'งาน',
      subject: 'สรุปผลแคมเปญเดือนตุลาคม', snippet: 'แนบไฟล์สรุปยอดเข้าชมและยอดขายของแคมเปญมาให้แล้ว',
      body: 'สวัสดีครับทุกคน\n\nแนบไฟล์สรุปผลแคมเปญเดือนตุลาคมมาให้แล้ว ยอดเข้าชมเพิ่มขึ้น 18% จากเดือนก่อน รบกวนดูหน้า 4 เรื่องงบโฆษณาเดือนหน้าด้วยนะครับ\n\nขอบคุณครับ\nทีมการตลาด',
      attach: 'สรุปแคมเปญ-ตุลาคม.pdf' },
    { id: 2, from: 'พี่ต้น หัวหน้าทีม', initial: 'ต', color: '#cfe3ff', addr: 'ton@example.com', time: '09:51', unread: true, label: 'งาน',
      subject: 'ประชุมทีมพรุ่งนี้ 10:00 น.', snippet: 'ย้ายไปห้อง 3B นะ เตรียมอัปเดตงานคนละ 5 นาที',
      body: 'ทุกคน\n\nประชุมทีมพรุ่งนี้ 10:00 น. ย้ายไปห้อง 3B นะ ให้แต่ละคนเตรียมอัปเดตงานคนละ 5 นาที ถ้าใครติดลูกค้าบอกล่วงหน้าได้เลย\n\nพี่ต้น' },
    { id: 3, from: 'ฝ่ายบุคคล', initial: 'บ', color: '#d9f2e6', addr: 'hr@example.com', time: '08:30', unread: true, label: 'ประกาศ',
      subject: 'แจ้งวันหยุดชดเชยเดือนพฤศจิกายน', snippet: 'บริษัทกำหนดวันหยุดชดเชยเพิ่ม 1 วัน ดูรายละเอียดในเมล',
      body: 'เรียนพนักงานทุกท่าน\n\nบริษัทกำหนดวันหยุดชดเชยเพิ่ม 1 วันในเดือนพฤศจิกายน รายละเอียดอยู่ในปฏิทินบริษัท หากมีงานที่ต้องส่งในวันดังกล่าว กรุณาแจ้งหัวหน้าทีมล่วงหน้า\n\nฝ่ายบุคคล' },
    { id: 4, from: 'ระบบบัญชี', initial: 'บ', color: '#fff1b8', addr: 'billing@example.com', time: 'เมื่อวาน', unread: false, label: 'บัญชี',
      subject: 'ใบแจ้งหนี้ INV-2026-1043 ครบกำหนด 31 ต.ค.', snippet: 'ยอดชำระ 12,500 บาท ชำระผ่านโอนเงินได้ตามปกติ',
      body: 'เรียนลูกค้า\n\nใบแจ้งหนี้เลขที่ INV-2026-1043 ยอดชำระ 12,500 บาท ครบกำหนดวันที่ 31 ตุลาคม รายละเอียดอยู่ในไฟล์แนบ\n\nระบบบัญชี (ข้อความอัตโนมัติ)',
      attach: 'INV-2026-1043.pdf' },
    { id: 5, from: 'มะปราง ลูกค้า', initial: 'ม', color: '#e6dcff', addr: 'maprang@example.com', time: 'เมื่อวาน', unread: false, label: 'ลูกค้า',
      subject: 'ขอแก้แบบโลโก้รอบที่ 2', snippet: 'ชอบเวอร์ชันสีชมพู ขอปรับฟอนต์ให้อ่านง่ายขึ้นอีกนิด',
      body: 'สวัสดีค่ะ\n\nชอบเวอร์ชันสีชมพูมากค่ะ ขอปรับฟอนต์ให้อ่านง่ายขึ้นอีกนิด และลองทำแบบพื้นหลังสีเข้มมาให้ดูด้วยได้ไหมคะ\n\nขอบคุณค่ะ\nมะปราง' },
    { id: 6, from: 'จดหมายข่าวออฟฟิศ', initial: 'จ', color: '#ffe0cc', addr: 'newsletter@example.com', time: '20 ต.ค.', unread: false, label: 'อ่านทีหลัง',
      subject: '5 วิธีจัดโต๊ะทำงานให้มีพลังทั้งวัน', snippet: 'แสงธรรมชาติ ต้นไม้เล็กๆ และแก้วน้ำใบโปรด',
      body: 'ฉบับนี้รวม 5 วิธีจัดโต๊ะทำงานให้ทำงานเพลิน ตั้งแต่การวางโต๊ะให้ได้แสงธรรมชาติ ไปจนถึงการมีต้นไม้เล็กๆ ไว้พักสายตา' }
  ],

  files: {
    usedGB: 38.2, totalGB: 100,
    folders: [
      { name: 'งานลูกค้า', count: 24, color: '#4f95ff' },
      { name: 'รูปภาพทีม', count: 132, color: '#ff9fb5' },
      { name: 'เอกสารบัญชี', count: 18, color: '#ffc75c' },
      { name: 'แชร์กับฉัน', count: 9, color: '#8fd3c1' }
    ],
    recent: [
      { name: 'แผนงาน Q4.docx', type: 'doc', size: '248 KB', mod: 'วันนี้ 09:12' },
      { name: 'งบประมาณ 2027.xlsx', type: 'xls', size: '1.2 MB', mod: 'เมื่อวาน' },
      { name: 'สไลด์นำเสนอลูกค้า.pptx', type: 'ppt', size: '8.4 MB', mod: '19 ต.ค.' },
      { name: 'สัญญาเช่าสำนักงาน.pdf', type: 'pdf', size: '640 KB', mod: '15 ต.ค.' },
      { name: 'โลโก้ใหม่-v2.png', type: 'img', size: '2.1 MB', mod: '14 ต.ค.' },
      { name: 'รายชื่อผู้ติดต่อ.xlsx', type: 'xls', size: '96 KB', mod: '10 ต.ค.' }
    ]
  },

  chats: [
    { id: 'design', name: 'กลุ่มทีมออกแบบ', initial: 'ก', color: '#ffd8c2', group: true, members: 6, unread: 3, time: '10:40',
      messages: [
        { who: 'ฝ้าย', text: 'ไฟล์โลโก้เวอร์ชันใหม่อัปขึ้นโฟลเดอร์แล้วนะ', time: '10:31' },
        { who: 'บอส', text: 'สีชมพูอ่อนลงอีกนิดได้มั้ย', time: '10:35' },
        { who: 'ฝ้าย', text: 'ได้เลย เดี๋ยวแก้ให้ก่อนเที่ยง', time: '10:40' }
      ] },
    { id: 'mom', name: 'แม่', initial: 'ม', color: '#ffd1dc', unread: 1, time: '09:15',
      messages: [{ text: 'วันนี้กลับบ้านกี่โมงลูก ทำกับข้าวรอนะ', time: '09:15' }] },
    { id: 'cafe', name: 'ร้านกาแฟหน้าออฟฟิศ', initial: 'ก', color: '#f2e2cf', official: true, unread: 1, time: '08:02',
      messages: [{ text: 'วันนี้ลาเต้เย็นซื้อ 1 แถม 1 ถึง 11 โมงนะ', time: '08:02' }] },
    { id: 'ton', name: 'พี่ต้น', initial: 'ต', color: '#cfe3ff', unread: 0, time: 'เมื่อวาน',
      messages: [
        { me: true, text: 'ส่งสรุปงานให้แล้วนะ', time: '17:20' },
        { text: 'โอเค ขอบใจมาก พรุ่งนี้คุยกันต่อ', time: '17:32' }
      ] },
    { id: 'friends', name: 'แก๊งเพื่อนมหาลัย', initial: 'พ', color: '#e6dcff', group: true, members: 8, unread: 0, time: '20 ต.ค.',
      messages: [
        { who: 'นัท', text: 'เสาร์นี้ไปคาเฟ่แมวกันมั้ย', time: '21:04' },
        { me: true, text: 'ไปๆ', time: '21:10' }
      ] }
  ],
  autoReplies: ['รับทราบ ขอบคุณนะ', 'โอเคเลย', 'เดี๋ยวดูให้นะ', 'ได้เลย'],

  weather: { city: 'กรุงเทพฯ', temp: 31, sky: 'เมฆบางส่วน', note: 'ช่วงเย็นมีโอกาสฝนตก 40%' },
  newsCats: { 'เทคโนโลยี': '#4f95ff', 'ธุรกิจ': '#ffb84d', 'ไลฟ์สไตล์': '#ff8fab', 'กีฬา': '#2fc46b' },
  news: [
    { id: 1, cat: 'เทคโนโลยี', fresh: true, time: '15 นาทีที่แล้ว', title: 'ผู้ช่วย AI ในออฟฟิศช่วยลดเวลาตอบอีเมลได้เกือบครึ่ง',
      summary: 'ผลสำรวจคนทำงานออฟฟิศพบว่าการใช้ผู้ช่วย AI ร่างอีเมลและสรุปประชุม ช่วยให้มีเวลาทำงานหลักมากขึ้นวันละราว 1 ชั่วโมง' },
    { id: 2, cat: 'ธุรกิจ', fresh: true, time: '40 นาทีที่แล้ว', title: 'ร้านกาแฟขนาดเล็กปรับตัวรับคนทำงานแบบไฮบริด',
      summary: 'หลายร้านเพิ่มโต๊ะยาวและปลั๊กไฟ พร้อมแพ็กเกจนั่งทำงานรายวัน เพื่อรับลูกค้าที่ทำงานนอกออฟฟิศบางวัน' },
    { id: 3, cat: 'ไลฟ์สไตล์', fresh: true, time: '1 ชั่วโมงที่แล้ว', title: 'จัดโต๊ะทำงานให้สบายตาด้วยแสงอุ่นและต้นไม้เล็ก',
      summary: 'นักออกแบบภายในแนะนำให้ใช้ไฟโทนอุ่นตอนเย็น และวางต้นไม้ใบเขียวไว้ในระยะสายตาเพื่อช่วยพักสายตา' },
    { id: 4, cat: 'เทคโนโลยี', time: '2 ชั่วโมงที่แล้ว', title: 'งานออกแบบ 3D สไตล์น่ารักกำลังมาแรงในแอปและเว็บไซต์',
      summary: 'แบรนด์หลายแห่งเริ่มใช้ตัวละคร 3D โทนพาสเทลบนหน้าเว็บ เพื่อให้ผู้ใช้รู้สึกเป็นมิตรและจดจำได้ง่าย' },
    { id: 5, cat: 'กีฬา', time: '3 ชั่วโมงที่แล้ว', title: 'ทีมฟุตซอลพนักงานออฟฟิศเตรียมลงแข่งรอบชิงสุดสัปดาห์นี้',
      summary: 'การแข่งขันฟุตซอลกระชับมิตรระหว่างบริษัทเดินทางมาถึงรอบชิง แข่งวันเสาร์นี้ช่วงบ่าย' },
    { id: 6, cat: 'ธุรกิจ', time: '5 ชั่วโมงที่แล้ว', title: 'ตลาดงานฟรีแลนซ์ปลายปีคึกคัก งานกราฟิกและวิดีโอสั้นนำโด่ง',
      summary: 'ความต้องการงานออกแบบกราฟิก วิดีโอสั้น และโมเดล 3D เพิ่มขึ้นชัดเจนช่วงไตรมาสสุดท้าย' },
    { id: 7, cat: 'ไลฟ์สไตล์', time: 'เมื่อวาน', title: 'มีแมวในออฟฟิศช่วยลดความเครียดได้จริงหรือ',
      summary: 'ออฟฟิศที่ให้นำสัตว์เลี้ยงมาได้รายงานว่าพนักงานพักสั้นๆ บ่อยขึ้น และบรรยากาศในทีมผ่อนคลายขึ้น' }
  ],

  videos: [
    // คลิปจริงบน YouTube ที่อนุญาตให้ฝังได้ (ภาพยนตร์สั้นแบบเปิดของ Blender และสถานีเพลง Lofi Girl)
    { id: 'aqz-KE-bpKQ', title: 'Big Buck Bunny 60fps 4K', channel: 'Blender', views: '', ago: 'ภาพยนตร์สั้น', dur: '10:35', colors: ['#ffb6c8', '#ffd166'], isNew: true, watched: 0 },
    { id: '4xDzrJKXOOY', title: 'synthwave radio: beats to chill/game to', channel: 'Lofi Girl', views: '', ago: 'ถ่ายทอดสด', dur: 'LIVE', colors: ['#7d8fe0', '#c9b6ff'], isNew: true, watched: 0 },
    { id: 'WhWc3b3KhnY', title: 'Spring - Blender Open Movie', channel: 'Blender Studio', views: '', ago: 'ภาพยนตร์สั้น', dur: '7:44', colors: ['#8fd3c1', '#fff1b8'], isNew: true, watched: 0 },
    { id: 'eRsGyueVLvQ', title: 'Sintel - Open Movie by Blender Foundation', channel: 'Blender', views: '', ago: 'ภาพยนตร์สั้น', dur: '14:48', colors: ['#d9a877', '#ffd8c2'], isNew: true, watched: 0 },
    { id: 'R6MlUcmOul8', title: 'Tears of Steel - Blender VFX Open Movie', channel: 'Blender', views: '', ago: 'ภาพยนตร์สั้น', dur: '12:14', colors: ['#9db8ff', '#8fe3c8'], watched: 0.4 },
    { id: 'TLkA0RELQ1g', title: 'Elephants Dream', channel: 'Blender', views: '', ago: 'ภาพยนตร์สั้น', dur: '10:54', colors: ['#ff9a76', '#ffd1dc'], watched: 0.2 }
  ]
};
