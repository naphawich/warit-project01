export type PreviewVideo = {
  type: "youtube";
  id: string;
  // Approximate length to show on the play badge ("2:14 นาที", etc.)
  durationLabel?: string;
};

export type Course = {
  id: number;
  title: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  level: "ระดับเริ่มต้น" | "ระดับกลาง" | "ระดับสูง" | "ทุกระดับ";
  lessons: number;
  hours: number;
  students: number;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice: number;
  color: string;
  instructor: {
    name: string;
    role: string;
    initials: string;
  };
  whatYouLearn: string[];
  features: string[];
  previewVideo?: PreviewVideo;
};

export const courses: Course[] = [
  {
    id: 1,
    title: "UX/UI Design มืออาชีพ ตั้งแต่พื้นฐานถึงระดับสูง",
    shortDescription:
      "เรียนรู้การออกแบบประสบการณ์ผู้ใช้และอินเทอร์เฟซ ตั้งแต่หลักการพื้นฐานจนถึงการสร้าง Design System ระดับมืออาชีพ",
    longDescription:
      "คอร์สนี้จะพาคุณเดินทางตั้งแต่หลักการพื้นฐานของ UX/UI Design การวิจัยผู้ใช้ การออกแบบ Wireframe การสร้าง Prototype ด้วย Figma ไปจนถึงการสร้าง Design System ที่ใช้งานได้จริงในองค์กรขนาดใหญ่ พร้อมตัวอย่าง Case Study จากโปรเจกต์จริง",
    category: "การออกแบบ",
    level: "ระดับเริ่มต้น",
    lessons: 42,
    hours: 18,
    students: 1280,
    rating: 4.9,
    reviewsCount: 312,
    price: 2990,
    originalPrice: 4990,
    color: "from-blue-500 to-blue-700",
    instructor: {
      name: "อาจารย์วฤศ ใจดี",
      role: "Senior Designer, Warit Studio",
      initials: "วฤ",
    },
    whatYouLearn: [
      "เข้าใจหลักการ UX/UI ที่ดีและกระบวนการคิดเชิงออกแบบ",
      "ทำ User Research, Persona และ User Journey ได้",
      "สร้าง Wireframe และ Prototype ด้วย Figma ระดับมืออาชีพ",
      "ออกแบบ Design System ที่ scale ได้",
      "นำเสนอผลงานต่อทีม และทำงานร่วมกับ Developer",
      "พร้อมพอร์ตโฟลิโอ 3 โปรเจกต์เมื่อจบคอร์ส",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "เข้าถึงได้ทุกอุปกรณ์",
      "กลุ่มผู้เรียนสำหรับถาม-ตอบ",
    ],
  },
  {
    id: 2,
    title: "Full-Stack Web Development ด้วย Next.js 16",
    shortDescription:
      "สร้างเว็บแอปพลิเคชันระดับโปรดักชันด้วย Next.js, React Server Components และ TypeScript ตั้งแต่ต้นจนปล่อยใช้งานจริง",
    longDescription:
      "คอร์สสำหรับนักพัฒนาที่อยากก้าวสู่ระดับ Senior กับเทคโนโลยีล่าสุด เรียนรู้การสร้างแอปพลิเคชันด้วย Next.js 16 App Router, React Server Components, Server Actions, การจัดการฐานข้อมูลด้วย Prisma, การ Auth ด้วย Auth.js และการ Deploy บน Vercel",
    category: "การพัฒนาเว็บไซต์",
    level: "ระดับกลาง",
    lessons: 65,
    hours: 32,
    students: 980,
    rating: 4.8,
    reviewsCount: 241,
    price: 3990,
    originalPrice: 5990,
    color: "from-indigo-500 to-indigo-700",
    instructor: {
      name: "ภาคิน ตั้งใจ",
      role: "Tech Lead, Acme Corp.",
      initials: "ภต",
    },
    whatYouLearn: [
      "เข้าใจ App Router และ React Server Components ลึกซึ้ง",
      "สร้าง REST API และ Server Actions",
      "เชื่อมต่อฐานข้อมูลด้วย Prisma + PostgreSQL",
      "ระบบ Authentication และ Authorization",
      "ทดสอบและ Optimize ประสิทธิภาพ",
      "Deploy บน Vercel พร้อม CI/CD",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "Source code ทุกบท",
      "อัปเดตเนื้อหาฟรี",
    ],
  },
  {
    id: 3,
    title: "Digital Marketing & SEO ที่ใช้ได้จริง",
    shortDescription:
      "เรียนรู้การตลาดออนไลน์ครบทุกช่องทาง พร้อม SEO ที่ทำให้เว็บคุณติดอันดับ Google และเพิ่มยอดขายอย่างยั่งยืน",
    longDescription:
      "คอร์สที่จะสอนคุณตั้งแต่พื้นฐานการตลาดดิจิทัล การยิงโฆษณา Facebook/Google Ads การทำ SEO ที่ได้ผลจริง การวิเคราะห์ข้อมูลด้วย Google Analytics 4 และการสร้าง Content Strategy เพื่อสร้างแบรนด์ที่ยั่งยืน",
    category: "การตลาดดิจิทัล",
    level: "ทุกระดับ",
    lessons: 38,
    hours: 16,
    students: 2150,
    rating: 4.9,
    reviewsCount: 580,
    price: 1990,
    originalPrice: 3490,
    color: "from-sky-500 to-sky-700",
    instructor: {
      name: "ณัฐนิช มั่นคง",
      role: "Marketing Director, Brandlab",
      initials: "ณม",
    },
    whatYouLearn: [
      "วาง Marketing Funnel ที่เหมาะกับธุรกิจคุณ",
      "ยิงโฆษณา Facebook & Google Ads ให้คุ้มทุน",
      "ทำ SEO On-page และ Off-page อย่างถูกต้อง",
      "ใช้ Google Analytics 4 วัดผลแคมเปญ",
      "เขียน Content ที่ดึงดูดและขายได้",
      "สร้างแบรนด์บน Social Media อย่างยั่งยืน",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "เทมเพลตและไฟล์งานพร้อมใช้",
      "กลุ่มแชร์ Case Study จริง",
    ],
  },
  {
    id: 4,
    title: "ภาษาอังกฤษเพื่อการทำงาน (Business English)",
    shortDescription:
      "เพิ่มความมั่นใจในการใช้ภาษาอังกฤษในที่ทำงาน ทั้งอีเมล ประชุม นำเสนอ และเจรจาธุรกิจ",
    longDescription:
      "คอร์สที่ออกแบบเฉพาะคนทำงาน ฝึกใช้ภาษาอังกฤษในสถานการณ์จริง พร้อมเทคนิคการเขียนอีเมลแบบมืออาชีพ คำศัพท์ที่ใช้บ่อยในที่ประชุม และวิธีนำเสนองานให้น่าประทับใจ",
    category: "ภาษาอังกฤษ",
    level: "ระดับกลาง",
    lessons: 48,
    hours: 22,
    students: 3420,
    rating: 4.8,
    reviewsCount: 892,
    price: 2490,
    originalPrice: 3990,
    color: "from-cyan-500 to-blue-600",
    instructor: {
      name: "Sarah Williams",
      role: "Business English Coach",
      initials: "SW",
    },
    whatYouLearn: [
      "เขียนอีเมลธุรกิจแบบมืออาชีพ",
      "พูดในที่ประชุมและนำเสนอได้คล่อง",
      "เจรจาต่อรองและตอบโต้สถานการณ์",
      "Vocabulary ใช้บ่อยในที่ทำงาน 500+ คำ",
      "ปรับสำเนียงให้เป็นธรรมชาติ",
      "Mock interview สำหรับสัมภาษณ์งาน",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "Workbook + audio files",
      "Live session เดือนละ 1 ครั้ง",
    ],
  },
  {
    id: 5,
    title: "การลงทุนในหุ้นและกองทุนสำหรับมือใหม่",
    shortDescription:
      "เริ่มลงทุนอย่างมั่นใจ เข้าใจตลาดหุ้น กองทุนรวม และวางแผนการเงินระยะยาว",
    longDescription:
      "เรียนรู้พื้นฐานการลงทุนแบบครบวงจร ตั้งแต่หลักการวางแผนการเงิน วิธีอ่านงบการเงินบริษัท การวิเคราะห์หุ้นเชิงพื้นฐาน การเลือกกองทุนรวม จนถึงการสร้างพอร์ตการลงทุนที่เหมาะกับเป้าหมายของคุณ",
    category: "ธุรกิจและการลงทุน",
    level: "ระดับเริ่มต้น",
    lessons: 36,
    hours: 14,
    students: 1850,
    rating: 4.7,
    reviewsCount: 423,
    price: 2290,
    originalPrice: 3490,
    color: "from-emerald-500 to-teal-700",
    instructor: {
      name: "ธีรพงษ์ ทรัพย์รวย",
      role: "นักวิเคราะห์การลงทุน CFA",
      initials: "ธท",
    },
    whatYouLearn: [
      "วางแผนการเงินส่วนบุคคลให้บรรลุเป้าหมาย",
      "อ่านงบการเงินบริษัทขั้นพื้นฐาน",
      "วิเคราะห์หุ้นด้วยปัจจัยพื้นฐาน",
      "เลือกกองทุนรวมที่เหมาะกับคุณ",
      "สร้างพอร์ตลงทุนแบบ Diversified",
      "บริหารความเสี่ยงและจิตวิทยาการลงทุน",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "Excel template วางแผนการเงิน",
      "Community นักลงทุน",
    ],
  },
  {
    id: 6,
    title: "Photography 101 ถ่ายภาพให้สวยด้วยกล้องมือถือ",
    shortDescription:
      "เรียนรู้องค์ประกอบภาพ การจัดแสง และการแต่งภาพ เพื่อถ่ายภาพสวยระดับมืออาชีพด้วยมือถือ",
    longDescription:
      "ไม่ต้องมีกล้องราคาแพง! คอร์สนี้จะสอนคุณตั้งแต่หลักการพื้นฐานของการถ่ายภาพ องค์ประกอบภาพ การจัดแสง การถ่ายภาพคน ภาพอาหาร ภาพท่องเที่ยว ไปจนถึงการแต่งภาพด้วยแอป Lightroom Mobile และ Snapseed",
    category: "การถ่ายภาพ",
    level: "ระดับเริ่มต้น",
    lessons: 32,
    hours: 12,
    students: 2780,
    rating: 4.9,
    reviewsCount: 654,
    price: 1490,
    originalPrice: 2490,
    color: "from-rose-500 to-pink-700",
    instructor: {
      name: "พิชญา รัตนพร",
      role: "Professional Photographer",
      initials: "พร",
    },
    whatYouLearn: [
      "เข้าใจ Exposure Triangle และโหมดถ่ายภาพ",
      "องค์ประกอบภาพ (Rule of Thirds, Leading Lines)",
      "การจัดแสงธรรมชาติและไฟต่อเนื่อง",
      "ถ่ายภาพ Portrait, Food, Travel ให้สวย",
      "แต่งภาพ Lightroom Mobile + Snapseed",
      "สร้าง Portfolio บน Instagram",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "Preset Lightroom 20+ แบบ",
      "รีวิวผลงานรายเดือน",
    ],
  },
  {
    id: 7,
    title: "Data Science & Machine Learning ด้วย Python",
    shortDescription:
      "เริ่มต้นสาย Data Science ด้วย Python เรียนรู้การวิเคราะห์ข้อมูลและสร้างโมเดล ML จริง",
    longDescription:
      "คอร์สสำหรับผู้ที่อยากเริ่มอาชีพ Data Scientist หรือ ML Engineer เริ่มจากพื้นฐาน Python, NumPy, Pandas, Visualization จนถึงการสร้างโมเดล Machine Learning ด้วย Scikit-learn และ Deep Learning เบื้องต้นด้วย PyTorch พร้อม Case Study จริง",
    category: "การพัฒนาเว็บไซต์",
    level: "ระดับสูง",
    lessons: 78,
    hours: 45,
    students: 720,
    rating: 4.9,
    reviewsCount: 198,
    price: 4990,
    originalPrice: 7990,
    color: "from-violet-500 to-purple-700",
    instructor: {
      name: "Dr. กิตติพงษ์ เอกชัย",
      role: "AI Research Scientist",
      initials: "กอ",
    },
    whatYouLearn: [
      "Python สำหรับ Data Science",
      "วิเคราะห์ข้อมูลด้วย Pandas และ NumPy",
      "Data Visualization ด้วย Matplotlib + Seaborn",
      "Machine Learning ด้วย Scikit-learn",
      "Deep Learning เบื้องต้นด้วย PyTorch",
      "สร้างโปรเจกต์ Portfolio 3 ชิ้น",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "Jupyter notebooks ทุกบท",
      "Dataset จริงจากอุตสาหกรรม",
    ],
  },
  {
    id: 8,
    title: "Motion Graphics สร้างวิดีโออนิเมชันด้วย After Effects",
    shortDescription:
      "สร้าง Motion Graphics สวยๆ สำหรับ YouTube, Instagram และโฆษณา ด้วย After Effects",
    longDescription:
      "เรียนรู้การสร้างวิดีโออนิเมชันตั้งแต่พื้นฐาน เข้าใจ Keyframe, Easing, Shape Layer การสร้าง Logo Animation, Lower Third, Transitions สวยๆ ที่ใช้ได้จริงในงาน Social Media และโฆษณา",
    category: "การออกแบบ",
    level: "ระดับกลาง",
    lessons: 52,
    hours: 28,
    students: 1340,
    rating: 4.8,
    reviewsCount: 287,
    price: 3490,
    originalPrice: 5490,
    color: "from-orange-500 to-red-600",
    instructor: {
      name: "ภาณุพงศ์ คมคาย",
      role: "Motion Designer",
      initials: "ภค",
    },
    whatYouLearn: [
      "พื้นฐาน Animation Principles",
      "Keyframe & Easing แบบมืออาชีพ",
      "สร้าง Logo Animation และ Reveal",
      "Lower Third + Subtitle Animation",
      "Transitions และ Effects สวยๆ",
      "Workflow จาก Premiere → After Effects",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "Project file ทุกตัวอย่าง",
      "เทมเพลตพร้อมใช้ 30 ชิ้น",
    ],
  },
  {
    id: 9,
    title: "Excel & Google Sheets สำหรับการทำงาน",
    shortDescription:
      "เก่ง Excel ใน 30 วัน จาก Pivot Table ถึง Macro ทำงานเร็วขึ้น 10 เท่า",
    longDescription:
      "ครอบคลุมทุกฟีเจอร์ที่คนทำงานต้องใช้ ตั้งแต่สูตรพื้นฐาน Pivot Table, VLOOKUP, INDEX-MATCH การสร้าง Dashboard, Conditional Formatting, Macro และ VBA เบื้องต้น พร้อมตัวอย่างจริงจากที่ทำงาน",
    category: "ธุรกิจและการลงทุน",
    level: "ทุกระดับ",
    lessons: 44,
    hours: 18,
    students: 4520,
    rating: 4.8,
    reviewsCount: 1120,
    price: 1290,
    originalPrice: 2290,
    color: "from-lime-500 to-green-700",
    instructor: {
      name: "ปวีณา สุขสมบูรณ์",
      role: "Excel MVP, Microsoft Certified",
      initials: "ปส",
    },
    whatYouLearn: [
      "สูตร Excel ที่ใช้บ่อย 50+ สูตร",
      "Pivot Table & Pivot Chart ระดับลึก",
      "VLOOKUP, INDEX-MATCH, XLOOKUP",
      "สร้าง Dashboard แบบ Interactive",
      "Macro และ VBA เบื้องต้น",
      "Google Sheets แทน Excel ได้ทั้งหมด",
    ],
    features: [
      "เรียนได้ตลอดชีพ",
      "ใบประกาศนียบัตร",
      "ไฟล์ตัวอย่างทุกบท",
      "Cheat sheet สูตรพร้อมใช้",
    ],
  },
];

export const reviews = [
  {
    id: 1,
    name: "พิมพ์ลภัส ศรีสุข",
    role: "Graphic Designer",
    rating: 5,
    text: "คอร์สสอนละเอียดมาก ผู้สอนเข้าใจง่าย ใช้งานได้จริงในการทำงาน เห็นผลลัพธ์ทันทีหลังจบคอร์ส แนะนำเลยค่ะ",
    initials: "พล",
  },
  {
    id: 2,
    name: "ธนกร วงศ์ไพบูลย์",
    role: "Software Developer",
    rating: 5,
    text: "เนื้อหาอัปเดต ทันสมัย ใช้เทคโนโลยีใหม่ล่าสุด ทำให้ผมได้งานใหม่ที่เงินเดือนสูงขึ้น คุ้มค่ามากครับ",
    initials: "ธก",
  },
  {
    id: 3,
    name: "ณัฐวดี จันทร์เพ็ญ",
    role: "Marketing Manager",
    rating: 5,
    text: "ทีมงานดูแลดีมาก มีกลุ่มให้ถามตอบ ผู้สอนมาตอบเองทุกคำถาม ได้ความรู้ใหม่ๆ ที่เอาไปใช้กับงานได้เลย",
    initials: "ณว",
  },
];

export const faqs = [
  {
    q: "เริ่มเรียนได้เลยทันทีหลังสมัครหรือไม่?",
    a: "ใช่ครับ หลังจากชำระเงินเสร็จ ระบบจะส่งอีเมลยืนยันและคุณสามารถเข้าเรียนได้ทันที 24 ชั่วโมง",
  },
  {
    q: "เรียนจบแล้วได้ใบประกาศนียบัตรไหม?",
    a: "ทุกคอร์สมีใบประกาศนียบัตรหลังจากเรียนจบและทำแบบทดสอบผ่านตามเกณฑ์ที่กำหนด สามารถดาวน์โหลดและพิมพ์ได้",
  },
  {
    q: "หากเรียนแล้วไม่พอใจสามารถขอคืนเงินได้หรือไม่?",
    a: "เรามีนโยบายคืนเงินภายใน 14 วัน หากคุณไม่พอใจกับคอร์ส โดยต้องเรียนไม่เกิน 30% ของเนื้อหาทั้งหมด",
  },
  {
    q: "คอร์สเรียนได้นานแค่ไหน?",
    a: "เมื่อซื้อคอร์สแล้วสามารถเข้าเรียนได้ตลอดชีพ ไม่จำกัดเวลา และได้รับอัปเดตเนื้อหาใหม่ๆ ฟรี",
  },
  {
    q: "สามารถเรียนผ่านมือถือได้ไหม?",
    a: "ได้ทุกอุปกรณ์ ทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์ มีระบบจดจำตำแหน่งการเรียนทำให้เรียนต่อจากเครื่องไหนก็ได้",
  },
  {
    q: "ถ้ามีคำถามระหว่างเรียนจะถามใคร?",
    a: "เรามีกลุ่มเรียนรู้สำหรับนักเรียนแต่ละคอร์ส ผู้สอนและทีมงานจะคอยตอบคำถามภายใน 24 ชั่วโมง",
  },
  {
    q: "มีโปรโมชั่นสำหรับการซื้อหลายคอร์สไหม?",
    a: "มีครับ หากซื้อ 2 คอร์สขึ้นไปลด 15% และ 3 คอร์สขึ้นไปลด 25% ดูรายละเอียดเพิ่มเติมในหน้าโปรโมชั่น",
  },
];
