/* =============================================================================
   دستیار نوین  |  Novin Profile — client-side demo assistant
   Fully offline / GitHub Pages friendly: no API, no keys, no backend.
   =============================================================================

   PRICING  —  قیمت‌های واحد محاسبه‌گر (تومان)
   ---------------------------------------------------------------------------
   همه‌ی اعداد این بلوک «نمونه / تقریبی» هستند و فقط برای نمایش قابلیت چت‌بات
   به کار می‌روند. برای به‌روزرسانی قیمت‌ها، فقط همین مقادیر را ویرایش کنید؛
   دستیار به‌طور خودکار از آن‌ها در برآورد استفاده می‌کند.

   واحد پول: تومان
   پروفیل:   تومان / متر طول پروفیل محاسبه‌شده
   شیشه:     تومان / متر مربع
   یراق:     تومان / هر لنگه (ساش)
   رنگ:      درصد افزایش روی هزینه‌ی پروفیل
   نصب:      تومان / متر مربع
   صرفه‌جویی انرژی: تومان / متر مربع / سال  (نمایشی، نسبت به شیشه‌ی یک‌جداره)
   ========================================================================== */
export const PRICING = {
  /* پروفیل یو‌پی‌وی‌سی، به ازای هر متر طول (قاب + ضریب ساش؛ پایین‌تر توضیح داده شده) */
  profilePerMeter: 850_000,

  /* شیشه، به ازای هر متر مربعِ مساحت پنجره */
  glassPerSqm: {
    double: 1_200_000,  // دوجداره با آرگون (نمونه)
    triple: 1_850_000,  // سه‌جداره (نمونه)
  },

  /* یراق‌آلات، به ازای هر لنگه بازشو. پنجره‌ی ثابت یراق ندارد.
     کشویی معمولاً دو لنگه دارد؛ لولایی و دوحالته یک لنگه. */
  hardwarePerSash: {
    fixed:    0,
    hinged:   1_400_000,
    tiltTurn: 1_900_000,
    sliding:  1_600_000,  // به‌ازای هر لنگه؛ پنجره‌ی کشویی × ۲ لنگه
  },

  /* چند برابر محیط بیرونی، برای تقریب طول پروفیل (قاب + ساش / ادوات) */
  profileFactor: {
    fixed:    1.15,
    hinged:   1.85,
    tiltTurn: 1.85,
    sliding:  2.15,
  },

  /* تعداد لنگه در هر واحد پنجره */
  sashes: {
    fixed: 0,
    hinged: 1,
    tiltTurn: 1,
    sliding: 2,
  },

  /* درصد مابه‌التفاوت رنگ / لمینت، فقط روی هزینه‌ی پروفیل */
  colorSurcharge: {
    white:      0,      // سفید یخی
    anthracite: 0.12,   // طوسی آنتراسیت  +۱۲٪
    oak:        0.18,   // بلوط طلایی     +۱۸٪
    walnut:     0.18,   // گردوی تیره     +۱۸٪
  },

  /* نصب، به ازای هر متر مربع */
  installPerSqm: 450_000,

  /* برآورد نمایشی صرفه‌جویی انرژی سالانه نسبت به شیشه‌ی یک‌جداره */
  energySavingPerSqmYear: {
    double: 180_000,
    triple: 240_000,
  },

  /* محدوده‌ی مجاز ابعاد (سانتی‌متر) و تعداد */
  limits: { minCm: 30, maxCm: 350, minQty: 1, maxQty: 30 },
};

/* اعداد نمایشی بخش شیشه — باید با js/main.js (MODES) یکی باشد */
const GLAZING_INFO = {
  single: { u: 5.8, db: 26, loss: 100 },
  double: { u: 1.3, db: 32, loss: 22 },
  triple: { u: 0.8, db: 38, loss: 14 },
};

const LABELS = {
  opening: { fixed: 'ثابت', hinged: 'لولایی (بازشو)', tiltTurn: 'دوحالته / کجشو', sliding: 'کشویی' },
  glazing: { double: 'دوجداره', triple: 'سه‌جداره' },
  color:   { white: 'سفید یخی', anthracite: 'طوسی آنتراسیت', oak: 'بلوط طلایی', walnut: 'گردوی تیره' },
};

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $id = id => document.getElementById(id);

/* ---------- numbers & text ---------- */
const FA = '۰۱۲۳۴۵۶۷۸۹';
const toFa = s => String(s).replace(/\d/g, d => FA[d]);
const faInt = n => toFa(Math.round(n).toLocaleString('en-US').replace(/,/g, '٬'));
const faDec = (n, d = 2) => {
  const [a, b] = Number(n).toFixed(d).split('.');
  return toFa(Number(a).toLocaleString('en-US').replace(/,/g, '٬')) + (d ? '٫' + toFa(b) : '');
};
const toman = n => faInt(n) + ' تومان';

const DIG = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
              '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
function parseFaNum(s) {
  const t = String(s).replace(/[۰-۹٠-٩]/g, ch => DIG[ch]).replace(/[٬,]/g, '').replace(/٫/g, '.');
  const m = t.match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}
function norm(s) {
  return String(s)
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ؤ/g, 'و')
    .replace(/[\u200c\u200d\u200e\u200f\u00a0]/g, ' ')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9۰-۹]+/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

/* ---------- FAQ ---------- */
const FAQ = [
  { id: 'profile', keys: ['پروفیل', 'چندمحفظه', 'چند محفظه', 'محفظه', 'یو پی وی سی', 'یوپی وی سی', 'upvc', 'پنج محفظه', '۵ محفظه', '5 محفظه', 'فریم', 'ساختار پروفیل', 'تقویت کننده', 'فولادی'],
    title: 'انواع و ساختار پروفیل',
    html: 'پروفیل‌های یو‌پی‌وی‌سی چندمحفظه‌ای از چند کانال هوای جدا تشکیل شده‌اند. هوا داخل این محفظه‌ها می‌ماند و مثل یک لایه‌ی عایق، عبور گرما و صدا را کم می‌کند. در میان پروفیل، تقویت‌کننده‌ی فولادی قرار می‌گیرد تا پنجره محکم بماند و خم نشود.<br><br>در بخش «ساختار پروفیل» می‌توانید مقطع را با اسکرول از هم باز کنید و محفظه‌ها، گسکت و زهوار را ببینید.' },
  { id: 'opening', keys: ['لولایی', 'کشویی', 'کجشو', 'کج شو', 'دوحالته', 'دو حالته', 'بازشو', 'ریلی', 'لیفت', 'اسلاید', 'tilt', 'sliding', 'ثابت', 'نوع بازشو', 'لولا'],
    title: 'انواع بازشو',
    html: 'چهار حالت اصلی داریم:<br>• <b>ثابت</b> — بدون بازشدن؛ فقط نور و عایق.<br>• <b>لولایی (بازشو)</b> — مناسب اتاق‌ها؛ کامل باز می‌شود و نظافت آسان است.<br>• <b>دوحالته / کجشو</b> — علاوه بر باز شدن کامل، از بالا کمی کج می‌شود برای تهویه‌ی امن. در ابتدای صفحه می‌توانید این حرکت را با اسکرول ببینید.<br>• <b>کشویی</b> — برای بالکن و فضاهای تنگ که لنگه نباید به داخل بچرخد؛ مدل لیفت‌اسلاید روان‌تر و آب‌بندتر است.' },
  { id: 'glazing', keys: ['شیشه', 'دوجداره', 'دو جداره', 'سه جداره', 'سه‌جداره', 'یک جداره', 'یک‌جداره', 'آرگون', 'low e', 'لوه ای', 'کم گسیل', 'جداره'],
    title: 'مقایسه‌ی شیشه‌ها',
    html: () => glazeExplain() },
  { id: 'color', keys: ['رنگ', 'لمینت', 'رنگها', 'رنگ ها', 'بلوط', 'گردو', 'آنتراسیت', 'انتراسیت', 'طوسی', 'سفید', 'طرح چوب', 'فویل'],
    title: 'رنگ‌ها و لمینت',
    html: 'چهار نمونه‌ی پرطرفدار را در سایت می‌بینید: <b>سفید یخی</b> (بدون افزایش قیمت نمونه)، <b>طوسی آنتراسیت</b>، طرح‌چوب <b>بلوط طلایی</b> و <b>گردوی تیره</b>. لمینت‌ها ضدخش و مقاوم در برابر نور خورشید هستند و با دکوراسیون داخلی یا نما هماهنگ می‌شوند.<br><br>در بخش «رنگ‌ها» می‌توانید پنجره‌ی سه‌بعدی را رنگ کنید و بچرخانید.' },
  { id: 'alu', keys: ['آلومینیوم', 'الومینیوم', 'روکش آلومینیوم', 'کاور آلومینیوم', 'آلومینیومی'],
    title: 'روکش آلومینیوم',
    html: 'پروفیل با روکش آلومینیوم ظاهر شیک و مقاومِ فلز را دارد، اما مغز آن همان یو‌پی‌وی‌سی عایق است. این ترکیب برای نماهای مدرن و اقلیم‌های خیلی آفتابی مناسب است: دوام رنگ آلومینیوم بیرون، و عایق‌بودن پروفیل در داخل.' },
  { id: 'warranty', keys: ['گارانتی', 'ضمانت', 'ضمانه', 'وارانتی', 'گارانتی دارد', 'چند سال ضمانت'],
    title: 'گارانتی',
    html: 'در این نسخه‌ی <b>نمونه</b>، ضمانت ۱۰ ساله برای پروفیل نمایش داده شده است. در سایت واقعی، مدت گارانتی پروفیل، یراق‌آلات و شیشه جداگانه و طبق قرارداد اعلام می‌شود. یو‌پی‌وی‌سی زنگ نمی‌زند و نیاز به رنگ‌آمیزی دوره‌ای ندارد؛ همین موضوع دوام گارانتی را بالا می‌برد.' },
  { id: 'install', keys: ['نصب', 'تحویل', 'زمان ساخت', 'چقدر طول', 'ارسال', 'بازدید', 'اندازه گیری', 'اندازه‌گیری', 'چند روز', 'چند هفته'],
    title: 'نصب و زمان تحویل',
    html: 'روند معمول (زمان‌ها <b>نمونه‌اند</b> و به حجم پروژه بستگی دارند): بازدید و اندازه‌گیری حدود ۳ تا ۷ روز، ساخت حدود ۲ تا ۴ هفته، و نصب هر واحد معمولاً یک تا دو روز. نصب اصولی برای آب‌بندی، عملکرد یراق و اعتبار گارانتی ضروری است. پس از ثبت درخواست، نوبت بازدید هماهنگ می‌شود.' },
  { id: 'energy', keys: ['انرژی', 'صرفه جویی', 'صرفه‌جویی', 'حرارت', 'گرما', 'سرما', 'قبض', 'عایق حرارتی', 'اتلاف', 'سرمایش', 'گرمایش', 'uw'],
    title: 'صرفه‌جویی انرژی',
    html: () => energyExplain() },
  { id: 'noise', keys: ['صدا', 'نویز', 'شلوغ', 'عایق صوتی', 'سر و صدا', 'سروصدا', 'دسی بل', 'دسی‌بل', 'db', 'آرامش'],
    title: 'کاهش صدا',
    html: () => noiseExplain() },
  { id: 'maint', keys: ['نگهداری', 'تمیز', 'شستشو', 'تعمیر', ' روغن', 'زنگ', 'مراقبت', 'نظافت', 'اسپری'],
    title: 'نگهداری',
    html: 'یو‌پی‌وی‌سی زنگ نمی‌زند و رنگ نمی‌خواهد؛ یکی از مزیت‌های اصلی‌اش همین بی‌نیازی از نگهداری است. برای نظافت، دستمال نرم و شوینده‌ی ملایم کافی است؛ از حلال‌های قوی، استون و سیم ظرفشویی استفاده نکنید. یراق‌آلات را سالی یک‌بار با روغن مخصوص کمی روان کنید و درزگیرها را بررسی کنید تا آب‌بندی حفظ شود.' },
];

function glazeExplain() {
  const s = GLAZING_INFO.single, d = GLAZING_INFO.double, t = GLAZING_INFO.triple;
  return `شیشه‌ی یک‌جداره عایق ضعیفی است (Uw حدود ${faDec(s.u, 1)} و کاهش صدا حدود ${faInt(s.db)} دسی‌بل — اعداد <b>نمایشی</b>).` +
    `<br><br><b>دوجداره</b> با گاز آرگون: Uw حدود ${faDec(d.u, 1)} وات بر مترمربع‌کلوین، کاهش صدا حدود ${faInt(d.db)} دسی‌بل، و اتلاف انرژی حدود ${faInt(d.loss)}٪ نسبت به یک‌جداره (یعنی تقریباً ${faInt(100 - d.loss)}٪ کمتر).` +
    `<br><b>سه‌جداره</b>: Uw حدود ${faDec(t.u, 1)}، کاهش صدا حدود ${faInt(t.db)} دسی‌بل، اتلاف حدود ${faInt(t.loss)}٪.` +
    `<br><br>این اعداد به ترکیب شیشه، پروفیل و نصب بستگی دارند. در بخش «شیشه» می‌توانید خودتان مقایسه را ببینید. اگر اندازه بدهید، برآورد قیمت و صرفه‌جویی سالانه را هم حساب می‌کنم.`;
}
function energyExplain() {
  const d = GLAZING_INFO.double, t = GLAZING_INFO.triple;
  return `بخش زیادی از اتلاف گرمای خانه از پنجره‌های ضعیف است.` +
    `<br>با <b>دوجداره</b> اتلاف نسبی به حدود ${faInt(d.loss)}٪ یک‌جداره می‌رسد (تقریباً ${faInt(100 - d.loss)}٪ کمتر) و برآورد نمایشی صرفه‌جویی حدود ${toman(PRICING.energySavingPerSqmYear.double)} به‌ازای هر متر مربع در سال است.` +
    `<br>با <b>سه‌جداره</b> اتلاف حدود ${faInt(t.loss)}٪ است (تقریباً ${faInt(100 - t.loss)}٪ کمتر) و صرفه‌جویی نمایشی حدود ${toman(PRICING.energySavingPerSqmYear.triple)} در متر مربع در سال.` +
    `<br><br>اگر عرض و ارتفاع پنجره‌ها را بگویید، یک رقم سالانه‌ی تقریبی برایتان حساب می‌کنم.`;
}
function noiseExplain() {
  const s = GLAZING_INFO.single, d = GLAZING_INFO.double, t = GLAZING_INFO.triple;
  return `اعداد نمایشی کاهش صدا در این دمو: یک‌جداره حدود ${faInt(s.db)} دسی‌بل، <b>دوجداره</b> حدود ${faInt(d.db)} دسی‌بل (حدود ${faInt(d.db - s.db)} دسی‌بل بهتر) و <b>سه‌جداره</b> حدود ${faInt(t.db)} دسی‌بل (حدود ${faInt(t.db - s.db)} دسی‌بل بهتر).` +
    `<br>هر ۳ دسی‌بل تقریباً یعنی حس نصف‌شدن بلندی صدا؛ پس همین اختلاف‌ها در خیابان شلوغ کاملاً محسوس است. برای خیابان‌های شلوغ، سه‌جداره یا شیشه‌ی لایه‌دار پیشنهاد می‌شود.`;
}

function matchTopic(text) {
  const n = norm(text);
  if (!n) return null;
  let best = null, score = 0;
  for (const t of FAQ) {
    let s = 0;
    for (const k of t.keys) {
      const kn = norm(k);
      if (kn && n.includes(kn)) s += kn.length >= 4 ? 2 : 1;
    }
    if (s > score) { score = s; best = t; }
  }
  return score >= 2 ? best : (score >= 1 ? best : null);
}

function detectOpening(n) {
  if (/کشویی|ریلی|اسلاید|لیفت|sliding/.test(n)) return 'sliding';
  if (/دوحالته|دو حالته|کجشو|کج شو|tilt|تهویه/.test(n)) return 'tiltTurn';
  if (/لولایی|لولا|بازشو|hinged/.test(n)) return 'hinged';
  if (/(?:^| )ثابت|فیکس|fixed/.test(n)) return 'fixed';
  return null;
}
function detectGlazing(n) {
  if (/سه.?جداره|triple|۳ جداره|3 جداره/.test(n)) return 'triple';
  if (/دو.?جداره|double|۲ جداره|2 جداره/.test(n)) return 'double';
  return null;
}
function detectColor(n) {
  if (/گردو|walnut/.test(n)) return 'walnut';
  if (/بلوط|oak/.test(n)) return 'oak';
  if (/آنتراسیت|انتراسیت|طوسی|anthracite|خاکستری/.test(n)) return 'anthracite';
  if (/سفید|white/.test(n)) return 'white';
  return null;
}
function detectQty(text) {
  const n = norm(text);
  const m = n.match(/(\d+)\s*(?:عدد|تخته|قلاده|قاب|ویندوز|پنجره)?/);
  const labeled = n.match(/تعداد\s*(\d+)/);
  if (labeled) return Number(String(labeled[1]).replace(/[۰-۹]/g, ch => DIG[ch] || ch)) || parseFaNum(labeled[1]);
  return null;
}
function parseDims(text) {
  const t = String(text).replace(/[۰-۹٠-٩]/g, ch => DIG[ch]).replace(/[٬,]/g, '');
  const pair = t.match(/(\d{2,3})\s*(?:[xX×*x]|در|عرض|و|,|،)\s*(\d{2,3})/);
  if (pair) return { w: +pair[1], h: +pair[2] };
  const wh = t.match(/عرض\s*(\d{2,3}).{0,12}?ارتفاع\s*(\d{2,3})/) || t.match(/ارتفاع\s*(\d{2,3}).{0,12}?عرض\s*(\d{2,3})/);
  if (wh) return { w: +wh[1], h: +wh[2] };
  return null;
}

/* ---------- quote ---------- */
function sashCount(type, qty) { return (PRICING.sashes[type] || 0) * qty; }

function quote(item) {
  const wM = item.w / 100, hM = item.h / 100, qty = item.qty;
  const peri = 2 * (wM + hM);
  const factor = PRICING.profileFactor[item.opening];
  const profileM = peri * factor * qty;
  const area = wM * hM * qty;
  const profile = profileM * PRICING.profilePerMeter;
  const glass = area * PRICING.glassPerSqm[item.glazing];
  const sashes = sashCount(item.opening, qty);
  const hardware = sashes * PRICING.hardwarePerSash[item.opening];
  const colorPct = PRICING.colorSurcharge[item.color] || 0;
  const color = profile * colorPct;
  const install = area * PRICING.installPerSqm;
  const total = profile + glass + hardware + color + install;
  const saving = area * PRICING.energySavingPerSqmYear[item.glazing];
  return { peri, profileM, area, profile, glass, hardware, color, colorPct, install, total, saving, sashes };
}

/* ---------- UI ---------- */
const HOME_CHIPS = [
  { t: 'محاسبه قیمت پنجره', act: 'calc' },
  { t: 'مقایسه شیشه‌ها', act: 'faq', topic: 'glazing' },
  { t: 'رنگ‌ها و لمینت', act: 'faq', topic: 'color' },
  { t: 'گارانتی و نصب', act: 'faq', topic: 'warrantyInstall' },
  { t: 'درخواست مشاوره', act: 'lead' },
];
const MORE_CHIPS = [
  { t: 'محاسبه قیمت پنجره', act: 'calc' },
  { t: 'درخواست مشاوره', act: 'lead' },
  { t: 'سوال‌های دیگر', act: 'home' },
];

const state = {
  open: false,
  booted: false,
  busy: false,
  mode: 'idle',      // idle | calc | lead
  step: '',
  draft: {},
  cart: [],
  greeted: false,
};

const el = {};

function setBusy(v) {
  state.busy = v;
  if (el.panel) el.panel.dataset.busy = v ? '1' : '0';
  if (el.send) el.send.disabled = v;
  if (el.input) el.input.disabled = v;
}
function setMode(mode, step) {
  state.mode = mode; state.step = step || '';
  if (el.panel) { el.panel.dataset.mode = mode; el.panel.dataset.step = state.step; }
}
function placeholder(p) { if (el.input) el.input.placeholder = p; }

function scrollLog(pin) {
  const go = () => {
    if (!el.log) return;
    const last = el.log.lastElementChild;
    if (!last) return;
    const start = pin || last.dataset.pin === 'start';
    last.scrollIntoView({ block: start ? 'start' : 'end', behavior: 'instant', inline: 'nearest' });
    if (!start) el.log.scrollTop = el.log.scrollHeight;
  };
  go();
  requestAnimationFrame(() => requestAnimationFrame(go));
}

function addBubble(who, html, opts = {}) {
  const art = document.createElement('article');
  art.className = 'nchat__msg nchat__msg--' + who;
  if (who === 'bot') {
    const av = document.createElement('span');
    av.className = 'nchat__ava'; av.setAttribute('aria-hidden', 'true'); av.innerHTML = ICON_WIN;
    art.appendChild(av);
  }
  const b = document.createElement('div');
  b.className = 'nchat__bubble';
  if (opts.text) b.textContent = html;
  else b.innerHTML = html;
  art.appendChild(b);
  if (opts.pin) art.dataset.pin = opts.pin;
  el.log.appendChild(art);
  scrollLog(opts.pin);
  return art;
}

function showTyping() {
  const art = document.createElement('article');
  art.className = 'nchat__msg nchat__msg--bot nchat__typing';
  art.id = 'nchatTyping';
  art.setAttribute('aria-label', 'در حال نوشتن');
  art.innerHTML = `<span class="nchat__ava" aria-hidden="true">${ICON_WIN}</span><div class="nchat__bubble"><i></i><i></i><i></i></div>`;
  el.log.appendChild(art); scrollLog();
}
function hideTyping() { $id('nchatTyping')?.remove(); }

function setChips(items) {
  el.chips.innerHTML = '';
  if (!items || !items.length) { el.chips.hidden = true; return; }
  el.chips.hidden = false;
  const box = document.createElement('div');
  box.className = 'nchat__chiprow';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'پاسخ‌های پیشنهادی');
  items.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nchat__chip';
    b.dataset.act = c.act || '';
    if (c.topic) b.dataset.topic = c.topic;
    if (c.val != null) b.dataset.val = c.val;
    b.textContent = c.t;
    box.appendChild(b);
  });
  el.chips.appendChild(box);
}

const delay = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 180) : ms));

async function botSay(html, chips, ms, pin) {
  setBusy(true);
  showTyping();
  const len = String(html).replace(/<[^>]+>/g, '').length;
  await delay(ms ?? (320 + Math.min(700, len * 8)));
  hideTyping();
  const usePin = pin || (len > 280 ? 'start' : undefined);
  addBubble('bot', html, { pin: usePin });
  if (chips !== undefined) setChips(chips);
  setBusy(false);
  scrollLog(usePin);
}

/* ---------- intents ---------- */
function isCancel(n) { return /^(لغو|انصراف|بی خیال|بی‌خیال|تمام|بسه|cancel|stop)$/.test(n) || /لغو محاسب|انصراف/.test(n); }
function isPriceIntent(n) { return /قیمت|محاسبه|برآورد|بر اورد|هزینه|چقدر میشه|چقدر می‌شه|عامل قیمت|استعلام/.test(n); }
function isLeadIntent(n) { return /مشاوره|تماس با|سفارش|درخواست بازدید|کارشناس|پیام بگذار|ثبت درخواست/.test(n); }
function isHello(n) { return /^(سلام|درود|سلام علیکم|hi|hello|hey|صبح بخیر|عصر بخیر|وقت بخیر)$/.test(n); }
function isThanks(n) { return /ممنون|مرسی|متشکرم|دستت درد|سپاس/.test(n); }

/* ---------- calculator flow ---------- */
function startCalc(seed = {}) {
  state.draft = { w: seed.w, h: seed.h, qty: seed.qty, opening: seed.opening, glazing: seed.glazing, color: seed.color };
  setMode('calc', 'width');
  askNext();
}

function missingField() {
  const d = state.draft;
  if (!(d.w > 0)) return 'width';
  if (!(d.h > 0)) return 'height';
  if (!(d.qty > 0)) return 'qty';
  if (!d.opening) return 'opening';
  if (!d.glazing) return 'glazing';
  if (!d.color) return 'color';
  return null;
}

function validDim(n) {
  const { minCm, maxCm } = PRICING.limits;
  return Number.isFinite(n) && n >= minCm && n <= maxCm;
}

async function askNext() {
  const miss = missingField();
  if (!miss) return showQuote();
  setMode('calc', miss);
  const L = PRICING.limits;
  if (miss === 'width') {
    placeholder('مثلاً: ۱۴۰');
    await botSay(`عرض پنجره چند <b>سانتی‌متر</b> است؟ (بین ${faInt(L.minCm)} تا ${faInt(L.maxCm)})`,
      [{ t: '۱۰۰', act: 'val', val: '100' }, { t: '۱۲۰', act: 'val', val: '120' }, { t: '۱۵۰', act: 'val', val: '150' }, { t: 'انصراف', act: 'cancel' }]);
  } else if (miss === 'height') {
    placeholder('مثلاً: ۱۵۰');
    await botSay(`ارتفاع را هم به <b>سانتی‌متر</b> بگویید. (بین ${faInt(L.minCm)} تا ${faInt(L.maxCm)})`,
      [{ t: '۱۰۰', act: 'val', val: '100' }, { t: '۱۴۰', act: 'val', val: '140' }, { t: '۲۲۰ (در)', act: 'val', val: '220' }, { t: 'انصراف', act: 'cancel' }]);
  } else if (miss === 'qty') {
    placeholder('مثلاً: ۲');
    await botSay('چند عدد از این اندازه می‌خواهید؟',
      [1, 2, 3, 4, 5].map(n => ({ t: toFa(n), act: 'val', val: String(n) })).concat([{ t: 'انصراف', act: 'cancel' }]));
  } else if (miss === 'opening') {
    placeholder('نوع بازشو را انتخاب کنید');
    await botSay('نوع بازشو کدام است؟', [
      { t: 'ثابت', act: 'val', val: 'fixed' },
      { t: 'لولایی', act: 'val', val: 'hinged' },
      { t: 'دوحالته / کجشو', act: 'val', val: 'tiltTurn' },
      { t: 'کشویی', act: 'val', val: 'sliding' },
      { t: 'انصراف', act: 'cancel' },
    ]);
  } else if (miss === 'glazing') {
    placeholder('نوع شیشه را انتخاب کنید');
    await botSay('شیشه دوجداره باشد یا سه‌جداره؟', [
      { t: 'دوجداره', act: 'val', val: 'double' },
      { t: 'سه‌جداره', act: 'val', val: 'triple' },
      { t: 'انصراف', act: 'cancel' },
    ]);
  } else if (miss === 'color') {
    placeholder('رنگ را انتخاب کنید');
    await botSay('رنگ یا لمینت پروفیل؟', [
      { t: 'سفید یخی', act: 'val', val: 'white' },
      { t: 'طوسی آنتراسیت', act: 'val', val: 'anthracite' },
      { t: 'بلوط طلایی', act: 'val', val: 'oak' },
      { t: 'گردوی تیره', act: 'val', val: 'walnut' },
      { t: 'انصراف', act: 'cancel' },
    ]);
  }
}

function ingest(text) {
  const d = state.draft, n = norm(text);
  const dims = parseDims(text);
  if (dims) {
    if (validDim(dims.w)) d.w = dims.w;
    if (validDim(dims.h)) d.h = dims.h;
  }
  const opening = detectOpening(n); if (opening) d.opening = opening;
  const glazing = detectGlazing(n); if (glazing) d.glazing = glazing;
  const color = detectColor(n); if (color) d.color = color;
  const qtyLabeled = (() => {
    const raw = String(text).replace(/[۰-۹٠-٩]/g, ch => DIG[ch]);
    const m = raw.match(/تعداد\s*(\d+)/) || raw.match(/(\d+)\s*عدد/);
    return m ? +m[1] : null;
  })();
  if (qtyLabeled && qtyLabeled >= PRICING.limits.minQty && qtyLabeled <= PRICING.limits.maxQty) d.qty = qtyLabeled;

  const num = parseFaNum(text);
  if (state.step === 'width' && !dims) {
    if (validDim(num)) d.w = num;
    else return `عرض باید عددی بین ${faInt(PRICING.limits.minCm)} تا ${faInt(PRICING.limits.maxCm)} سانتی‌متر باشد.`;
  } else if (state.step === 'height' && !(d.h > 0)) {
    if (validDim(num)) d.h = num;
    else return `ارتفاع باید عددی بین ${faInt(PRICING.limits.minCm)} تا ${faInt(PRICING.limits.maxCm)} سانتی‌متر باشد.`;
  } else if (state.step === 'qty' && !(d.qty > 0)) {
    if (Number.isFinite(num) && num >= PRICING.limits.minQty && num <= PRICING.limits.maxQty) d.qty = num;
    else return `تعداد باید بین ${faInt(PRICING.limits.minQty)} تا ${faInt(PRICING.limits.maxQty)} باشد.`;
  } else if (state.step === 'opening' && !d.opening) {
    return 'لطفاً یکی از گزینه‌های بازشو را انتخاب کنید.';
  } else if (state.step === 'glazing' && !d.glazing) {
    if (/یک.?جداره|single/.test(n)) return 'برای پنجره‌ی جدید فقط دوجداره یا سه‌جداره را پیشنهاد می‌کنیم. یکی را انتخاب کنید.';
    return 'لطفاً دوجداره یا سه‌جداره را انتخاب کنید.';
  } else if (state.step === 'color' && !d.color) {
    return 'لطفاً یکی از رنگ‌های پیشنهادی را انتخاب کنید.';
  }
  return null;
}

async function showQuote() {
  const item = { ...state.draft };
  const q = quote(item);
  state.cart.push({ item, q });
  const idx = state.cart.length;
  const running = state.cart.reduce((s, x) => s + x.q.total, 0);
  const saving = state.cart.reduce((s, x) => s + x.q.saving, 0);
  const g = GLAZING_INFO[item.glazing];

  if (item.color) syncColour(item.color);

  const rows = [
    ['پروفیل (' + faDec(q.profileM, 2) + ' متر)', q.profile],
    ['شیشه‌ی ' + LABELS.glazing[item.glazing] + ' (' + faDec(q.area, 2) + ' م²)', q.glass],
    q.hardware ? ['یراق‌آلات (' + faInt(q.sashes) + ' لنگه)', q.hardware] : null,
    q.color ? ['مابه‌التفاوت رنگ (' + faInt(q.colorPct * 100) + '٪)', q.color] : ['مابه‌التفاوت رنگ', 0],
    ['نصب (' + faDec(q.area, 2) + ' م²)', q.install],
  ].filter(Boolean);

  const html = `
    <p><b>برآورد قیمت نمونه (تقریبی)</b> — ردیف ${faInt(idx)}</p>
    <p class="nchat__meta">${faInt(item.w)} × ${faInt(item.h)} سانتی‌متر · ${faInt(item.qty)} عدد<br>
      ${LABELS.opening[item.opening]} · شیشه‌ی ${LABELS.glazing[item.glazing]} · ${LABELS.color[item.color]}<br>
      مساحت کل: ${faDec(q.area, 2)} م² · محیط تقریبی پروفیل: ${faDec(q.profileM, 2)} متر</p>
    <ul class="nchat__quote">
      ${rows.map(([k, v]) => `<li><span>${k}</span><b dir="ltr">${toman(v)}</b></li>`).join('')}
      <li class="nchat__sum"><span>جمع این ردیف</span><b dir="ltr">${toman(q.total)}</b></li>
      ${idx > 1 ? `<li class="nchat__sum nchat__sum--all"><span>جمع کل سبد (${faInt(idx)} ردیف)</span><b dir="ltr">${toman(running)}</b></li>` : ''}
    </ul>
    <p class="nchat__save">صرفه‌جویی انرژی سالانه نسبت به شیشه‌ی یک‌جداره (نمایشی): حدود <b>${toman(q.saving)}</b> در سال
      ${idx > 1 ? `— مجموع سبد حدود <b>${toman(saving)}</b>` : ''}.
      Uw حدود ${faDec(g.u, 1)} و کاهش صدا حدود ${faInt(g.db)} دسی‌بل.</p>
    <p class="nchat__warn">⚠ این اعداد <b>نمونه و تقریبی</b>‌اند و قیمت نهایی پس از بازدید، اندازه‌گیری و انتخاب یراق اعلام می‌شود.</p>`;

  setMode('idle');
  placeholder('پیام شما…');
  const chips = [
    { t: 'افزودن پنجره‌ی دیگر', act: 'calc-add' },
    { t: 'درخواست مشاوره', act: 'lead' },
    { t: 'شروع دوباره', act: 'calc-reset' },
    { t: 'سوال‌های دیگر', act: 'home' },
  ];
  await botSay(html, chips, 700);
}

function syncColour(key) {
  window.__pendingFinish = key;
  try {
    const p = window.__picker && window.__picker();
    if (p && typeof p.setFinish === 'function') p.setFinish(key);
  } catch { /* picker may not be ready */ }
  const sw = document.querySelector(`.sw[data-k="${key}"]`);
  if (!sw) return;
  document.querySelectorAll('#swatches .sw').forEach(x => {
    const on = x === sw;
    x.classList.toggle('is-on', on);
    x.setAttribute('aria-checked', on);
  });
  const name = document.getElementById('colorName');
  const b = sw.querySelector('b');
  if (name && b) name.textContent = b.textContent;
}

/* ---------- lead form ---------- */
async function startLead() {
  setMode('lead', 'form');
  placeholder('یا همین‌جا پیام بنویسید…');
  const html = `
    <p>فرم کوتاه مشاوره را پر کنید. در این دمو چیزی ارسال نمی‌شود؛ در سایت واقعی همین اطلاعات به ایمیل، پیامک، تلگرام یا بله می‌رسد.</p>
    <form class="nchat__form" novalidate>
      <label>نام و نام خانوادگی<input name="name" type="text" autocomplete="name" required placeholder="مثلاً: علی رضایی"></label>
      <label>شماره‌ی تماس<input name="phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" required placeholder="۰۹۰۰ ۰۰۰ ۰۰۰۰"></label>
      <label>شهر<input name="city" type="text" autocomplete="address-level2" required placeholder="مثلاً: کرج"></label>
      <label>شرح نیاز<textarea name="need" rows="3" required placeholder="نوع پنجره، متراژ تقریبی، زمان پروژه"></textarea></label>
      <div class="nchat__form-actions"><button class="nchat__submit" type="submit">ثبت درخواست</button><button class="nchat__cancel" type="button" data-act="cancel">انصراف</button></div>
    </form>`;
  await botSay(html, [], 360, 'start');
  const form = el.log.querySelector('.nchat__form:last-of-type');
  form?.addEventListener('submit', onLeadSubmit);
  form?.querySelector('[data-act="cancel"]')?.addEventListener('click', () => onChip({ dataset: { act: 'cancel' }, textContent: 'انصراف' }));
  form?.querySelector('input')?.focus();
}

async function onLeadSubmit(e) {
  e.preventDefault();
  const f = e.currentTarget;
  const val = name => (f.elements.namedItem(name)?.value || '').trim();
  const name = val('name');
  const phone = val('phone');
  const city = val('city');
  const need = val('need');
  const digits = phone.replace(/[۰-۹٠-٩]/g, ch => DIG[ch] || ch).replace(/\D/g, '');
  if (name.length < 2) { f.name.focus(); return; }
  if (digits.length < 8) { f.phone.focus(); return; }
  if (city.length < 2) { f.city.focus(); return; }
  if (need.length < 3) { f.need.focus(); return; }
  [...f.elements].forEach(x => x.disabled = true);
  addBubble('user', [name, phone, city, need].join(' · '), { text: true });
  setMode('idle');
  placeholder('پیام شما…');
  const cartNote = state.cart.length
    ? `<br>سبد برآورد نمونه: ${faInt(state.cart.length)} ردیف، جمع تقریبی ${toman(state.cart.reduce((s, x) => s + x.q.total, 0))}.`
    : '';
  await botSay(
    `<p><b>درخواست شما ثبت شد (نمایشی).</b></p>
     <p>${esc(name)} عزیز، پیام‌تان برای پروژه‌ی «${esc(need)}» در ${esc(city)} با شماره‌ی <span dir="ltr">${esc(phone)}</span> دریافت شد.${cartNote}</p>
     <p class="nchat__warn">در سایت واقعی این درخواست به ایمیل، پیامک، تلگرام یا بله ارسال می‌شود. در این دمو پیامی واقعاً ارسال نشد.</p>`,
    MORE_CHIPS, 500, 'start');
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* ---------- greeting / routing ---------- */
async function greet(rehello = false) {
  setMode('idle');
  placeholder('پیام شما یا انتخاب گزینه…');
  const hello = rehello
    ? 'دوباره سلام! چطور می‌توانم کمک کنم؟'
    : 'سلام! من <b>دستیار نوین</b> هستم و هر ساعت از شبانه‌روز آماده‌ام. می‌توانم قیمت تقریبی پنجره را حساب کنم، شیشه‌ها و رنگ‌ها را مقایسه کنم یا درخواست مشاوره ثبت کنم.<br><br>از گزینه‌های زیر انتخاب کنید یا سوال‌تان را بنویسید.';
  await botSay(hello, HOME_CHIPS, rehello ? 280 : 520);
  state.greeted = true;
}

async function answerTopic(id) {
  if (id === 'warrantyInstall') {
    const w = FAQ.find(t => t.id === 'warranty');
    const i = FAQ.find(t => t.id === 'install');
    await botSay(`<b>${w.title} و ${i.title}</b><br>${w.html}<br><br>${i.html}`, [
      { t: 'محاسبه قیمت پنجره', act: 'calc' },
      { t: 'درخواست مشاوره', act: 'lead' },
      { t: 'سوال‌های دیگر', act: 'home' },
    ]);
    return;
  }
  const t = FAQ.find(x => x.id === id);
  if (!t) return fallback();
  const body = typeof t.html === 'function' ? t.html() : t.html;
  const extra = [];
  if (id === 'glazing' || id === 'energy' || id === 'noise') {
    extra.push({ t: 'محاسبه قیمت پنجره', act: 'calc' });
    extra.push({ t: 'دیدن مقایسه‌ی شیشه', act: 'goto', val: '#glazing' });
  }
  if (id === 'color') extra.push({ t: 'دیدن رنگ‌ها در سایت', act: 'goto', val: '#colors' });
  if (id === 'profile') extra.push({ t: 'دیدن مقطع پروفیل', act: 'goto', val: '#structure' });
  extra.push({ t: 'درخواست مشاوره', act: 'lead' }, { t: 'سوال‌های دیگر', act: 'home' });
  await botSay(`<b>${t.title}</b><br>${body}`, extra);
}

async function fallback() {
  await botSay('این مورد را دقیق متوجه نشدم. می‌توانید از گزینه‌های زیر انتخاب کنید، سوال‌تان را جور دیگری بپرسید، یا برای پاسخ دقیق‌تر درخواست مشاوره بگذارید.', HOME_CHIPS);
}

async function handleUser(text, fromChip = false) {
  const raw = String(text || '').trim();
  if (!raw) return;
  if (!fromChip) addBubble('user', raw, { text: true });
  const n = norm(raw);

  if (isCancel(n) || (fromChip && raw === 'انصراف')) {
    setMode('idle'); placeholder('پیام شما…');
    await botSay('باشه، محاسبه‌ها را کنار گذاشتم. از گزینه‌های زیر ادامه بدهید.', HOME_CHIPS, 250);
    return;
  }

  if (state.mode === 'calc') {
    const err = ingest(raw);
    if (err) { await botSay(err); return; }
    // acknowledge short values only when still missing fields
    if (missingField()) await askNext();
    else await showQuote();
    return;
  }

  if (state.mode === 'lead' && !fromChip) {
    // free text during lead: treat as the "need" if form exists? just route
    if (isPriceIntent(n)) { setMode('idle'); return startCalc(); }
  }

  if (isHello(n)) return greet(true);
  if (isThanks(n)) {
    await botSay('خواهش می‌کنم. اگر سوال دیگری هست بپرسید یا از گزینه‌ها انتخاب کنید.', HOME_CHIPS, 280);
    return;
  }
  if (isLeadIntent(n)) return startLead();
  if (isPriceIntent(n)) {
    const seed = {};
    const dims = parseDims(raw); if (dims) { seed.w = dims.w; seed.h = dims.h; }
    const opening = detectOpening(n); if (opening) seed.opening = opening;
    const glazing = detectGlazing(n); if (glazing) seed.glazing = glazing;
    const color = detectColor(n); if (color) seed.color = color;
    return startCalc(seed);
  }

  const topic = matchTopic(raw);
  if (topic) return answerTopic(topic.id);

  // energy/noise with a size in the same sentence
  if (/صرفه|انرژی|صدا|دسی/.test(n) && parseDims(raw)) {
    const dims = parseDims(raw);
    const area = (dims.w / 100) * (dims.h / 100);
    await botSay(
      `برای یک پنجره‌ی ${faInt(dims.w)} × ${faInt(dims.h)} سانتی‌متر (مساحت ${faDec(area, 2)} م²)، برآورد <b>نمایشی</b> صرفه‌جویی انرژی سالانه نسبت به یک‌جداره حدود ${toman(area * PRICING.energySavingPerSqmYear.double)} با شیشه‌ی دوجداره و حدود ${toman(area * PRICING.energySavingPerSqmYear.triple)} با سه‌جداره است. کاهش صدا هم مطابق بخش شیشه حدود ${faInt(GLAZING_INFO.double.db)} و ${faInt(GLAZING_INFO.triple.db)} دسی‌بل است.`,
      MORE_CHIPS);
    return;
  }
  return fallback();
}

async function onChip(btn) {
  if (state.busy) return;
  const act = btn.dataset.act;
  const val = btn.dataset.val;
  const topic = btn.dataset.topic;
  const label = btn.textContent.trim();

  if (act === 'val') {
    addBubble('user', label, { text: true });
    // map val into current step
    if (state.mode === 'calc') {
      const d = state.draft;
      if (state.step === 'width') d.w = +val;
      else if (state.step === 'height') d.h = +val;
      else if (state.step === 'qty') d.qty = +val;
      else if (state.step === 'opening') d.opening = val;
      else if (state.step === 'glazing') d.glazing = val;
      else if (state.step === 'color') d.color = val;
      if (missingField()) await askNext();
      else await showQuote();
    }
    return;
  }
  if (act === 'calc' || act === 'calc-add') {
    addBubble('user', label, { text: true });
    return startCalc();
  }
  if (act === 'calc-reset') {
    addBubble('user', label, { text: true });
    state.cart = [];
    return startCalc();
  }
  if (act === 'lead') {
    addBubble('user', label, { text: true });
    return startLead();
  }
  if (act === 'faq') {
    addBubble('user', label, { text: true });
    return answerTopic(topic);
  }
  if (act === 'home') {
    addBubble('user', label, { text: true });
    setMode('idle'); placeholder('پیام شما…');
    await botSay('چه کمکی از دستم برمی‌آید؟', HOME_CHIPS, 250);
    return;
  }
  if (act === 'cancel') {
    addBubble('user', label, { text: true });
    setMode('idle'); placeholder('پیام شما…');
    await botSay('باشه. از گزینه‌های زیر ادامه بدهید.', HOME_CHIPS, 250);
    return;
  }
  if (act === 'goto') {
    const target = document.querySelector(val);
    if (target) {
      closeChat();
      setTimeout(() => target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 80);
    }
    return;
  }
  return handleUser(label, false);
}

/* ---------- open / close / a11y ---------- */
const ICON_WIN = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="7" y="4" width="26" height="32" rx="2.5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M11 8h9v24h-9z" fill="#4fb2e8"/><path d="M22 8h7v24h-7z" fill="#bfe3f5" opacity=".8"/><circle cx="26.5" cy="21" r="1.6" fill="currentColor"/></svg>`;
const ICON_CHAT = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2zm3 5a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2H7zm0 4a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H7z"/></svg>`;
const ICON_X = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"/></svg>`;
const ICON_SEND = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 11.2 20.2 3.5c.7-.3 1.4.4 1.1 1.1l-7.7 16.8c-.3.7-1.3.6-1.5-.1L11 14.2c-.1-.3-.3-.5-.6-.6l-7-.1c-.8 0-1-.9-.2-1.3z"/></svg>`;

function focusables() {
  return [...el.panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(n => !n.disabled && n.offsetParent !== null && !n.closest('[hidden]'));
}

function openChat() {
  if (state.open) return;
  state.open = true;
  el.root.classList.add('is-open');
  el.panel.hidden = false;
  el.fab.setAttribute('aria-expanded', 'true');
  el.badge.hidden = true;
  document.body.classList.add('nchat-lock');
  const prev = document.activeElement;
  el.root.dataset.returnFocus = '1';
  el._prevFocus = prev;
  requestAnimationFrame(() => (el.input?.disabled ? el.close : el.input)?.focus());
  if (!state.greeted && !state.busy) greet();
}

function closeChat() {
  if (!state.open) return;
  state.open = false;
  el.root.classList.remove('is-open');
  el.panel.hidden = true;
  el.fab.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nchat-lock');
  el.fab.focus();
}

function onKey(e) {
  if (!state.open) return;
  if (e.key === 'Escape') { e.preventDefault(); closeChat(); return; }
  if (e.key !== 'Tab') return;
  const list = focusables();
  if (!list.length) return;
  const first = list[0], last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function mount() {
  if ($id('nchat')) return;
  const root = document.createElement('div');
  root.className = 'nchat';
  root.id = 'nchat';
  root.innerHTML = `
    <button class="nchat__fab" id="chatFab" type="button" aria-expanded="false" aria-controls="chatPanel" aria-haspopup="dialog" aria-label="باز کردن دستیار نوین، آنلاین ۲۴/۷">
      <span class="nchat__pulse" aria-hidden="true"></span>
      ${ICON_CHAT}
      <span class="nchat__badge" id="chatBadge">۱</span>
    </button>
    <section class="nchat__panel" id="chatPanel" role="dialog" aria-modal="true" aria-labelledby="chatTitle" hidden>
      <header class="nchat__head">
        <span class="nchat__ava nchat__ava--lg" aria-hidden="true">${ICON_WIN}</span>
        <div class="nchat__who">
          <h2 id="chatTitle">دستیار نوین</h2>
          <p class="nchat__status"><i></i> آنلاین ۲۴/۷</p>
        </div>
        <span class="nchat__tag">نمونه</span>
        <button class="nchat__x" id="chatClose" type="button" aria-label="بستن گفتگو">${ICON_X}</button>
      </header>
      <div class="nchat__log" id="chatLog" role="log" aria-live="polite" aria-relevant="additions" aria-label="پیام‌های گفتگو"></div>
      <div class="nchat__chips" id="chatChips" hidden></div>
      <form class="nchat__composer" id="chatForm">
        <label class="visually-hidden" for="chatInput">پیام شما</label>
        <input class="nchat__input" id="chatInput" type="text" autocomplete="off" enterkeyhint="send" placeholder="پیام شما…">
        <button class="nchat__send" id="chatSend" type="submit" aria-label="ارسال">${ICON_SEND}</button>
      </form>
    </section>`;
  document.body.appendChild(root);

  el.root = root;
  el.fab = $id('chatFab');
  el.panel = $id('chatPanel');
  el.log = $id('chatLog');
  el.chips = $id('chatChips');
  el.input = $id('chatInput');
  el.send = $id('chatSend');
  el.close = $id('chatClose');
  el.badge = $id('chatBadge');
  el.form = $id('chatForm');

  el.fab.addEventListener('click', () => (state.open ? closeChat() : openChat()));
  el.close.addEventListener('click', closeChat);
  el.form.addEventListener('submit', e => {
    e.preventDefault();
    if (state.busy) return;
    const v = el.input.value;
    el.input.value = '';
    handleUser(v);
  });
  el.chips.addEventListener('click', e => {
    const b = e.target.closest('.nchat__chip');
    if (b) onChip(b);
  });
  document.addEventListener('keydown', onKey);
  setMode('idle');
  setBusy(false);
  document.getElementById('openChatHint')?.addEventListener('click', openChat);
}

mount();
