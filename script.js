let selectedLanguage="ar", selectedLevel="B1", selectedCategory="عشوائي";
let isRecording=false, timerSeconds=120, timerInterval=null;
let mediaRecorder=null, audioChunks=[], audioURL=null, sessionStart=0, sessionSeconds=0;
let recognition=null, transcript='';
let claudeSample=null;

(async()=>{
  try{ if(window.claude && typeof window.claude.use==='function'){ claudeSample = await window.claude.use('sample'); } }catch(e){}
})();

// Web Audio API Sound Effects for Wheel
function playClickSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch(e) {}
}

function playWinSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + index * 0.1);
      osc.stop(ctx.currentTime + index * 0.1 + 0.3);
    });
  } catch(e) {}
}

const arabicTopics = {
  "عشوائي": [
    "يوم ما بنساه",
    "أغرب حلم",
    "مكان نفسي أزوره",
    "عادة غريبة عندي",
    "موقف محرج",
    "لو رجع فيني الزمن",
    "شغلة بتخليني أضحك",
    "قرار ندمت عليه"
  ],
  "الشغل": [
    "أول شغل إلي",
    "الفريلانس",
    "شغل أحلامي",
    "أسوأ مدير",
    "العمل من البيت",
    "أول راتب",
    "شغل ما بقدر أعمله",
    "النجاح بالشغل"
  ],
  "الأكل": [
    "الفطور المفضل",
    "أكلة ما بملّ منها",
    "أول طبخة عملتها",
    "أكل الشارع",
    "أكلة أكرهها",
    "أكل آخر الليل",
    "مطعم ما بنساه",
    "أكلة بتذكرني بالبيت"
  ],
  "الرياضة والجسم": [
    "الكارديو",
    "أول مرة بالنادي",
    "رياضة بحبها",
    "رياضة ما بفهمها",
    "المشي",
    "يوم بدون حركة",
    "شكل الجسم",
    "الرياضة والمزاج"
  ],
  "الفلوس": [
    "أول دين",
    "أول مصروف",
    "أول راتب",
    "أغلى شي اشتريته",
    "التوفير",
    "المصروف بدون حساب",
    "الفلوس والسعادة",
    "شغلة نفسي اشتريها"
  ],
  "السوشيال ميديا": [
    "باسورد نسيته",
    "أول حساب إلي",
    "أول موبايل",
    "السوشيال ميديا",
    "يوم بدون موبايل",
    "صورة ندمت إني نشرتها",
    "تطبيق ما بقدر أعيش بدونه",
    "الإنترنت غيّر حياتي"
  ],
  "يومياتك": [
    "شخص غيّر تفكيري",
    "موقف ما بنساه",
    "قرار غيّر حياتي",
    "يوم كان مختلف",
    "شخص بتمنى أقابله",
    "نصيحة ما نسيتها",
    "موقف خلاني أضحك",
    "شغلة اكتشفتها عن حالي"
  ]
};

const englishTopics = {
  "عشوائي": [
    "A day I will never forget",
    "The strangest dream",
    "A place I wish to visit",
    "A strange habit I have",
    "An embarrassing situation",
    "If I could turn back time",
    "Something that makes me laugh",
    "A decision I regretted"
  ],
  "الشغل": [
    "My very first job",
    "Freelancing",
    "My dream job",
    "The worst boss",
    "Working from home",
    "My first salary",
    "A job I could never do",
    "Success at work"
  ],
  "الأكل": [
    "Favorite breakfast",
    "A meal I never get tired of",
    "The first dish I cooked",
    "Street food",
    "A dish I hate",
    "Late-night food",
    "An unforgettable restaurant",
    "A dish that reminds me of home"
  ],
  "الرياضة والجسم": [
    "Cardio workouts",
    "First time at the gym",
    "A sport I love",
    "A sport I don't understand",
    "Walking",
    "A day without movement",
    "Body shape and fitness",
    "Exercise and mood"
  ],
  "الفلوس": [
    "My first debt",
    "My first allowance",
    "My first salary",
    "The most expensive thing I bought",
    "Saving money",
    "Spending without limits",
    "Money and happiness",
    "Something I really want to buy"
  ],
  "السوشيال ميديا": [
    "A password I forgot",
    "My first social account",
    "My first mobile phone",
    "Social media life",
    "A day without my phone",
    "A photo I regretted posting",
    "An app I can't live without",
    "How the internet changed my life"
  ],
  "يومياتك": [
    "Someone who changed my mindset",
    "An unforgettable moment",
    "A life-changing decision",
    "A day that was different",
    "Someone I wish to meet",
    "Advice I never forgot",
    "A moment that made me laugh",
    "Something I discovered about myself"
  ]
};

function getHistory(){try{return JSON.parse(localStorage.getItem('ehki_history')||'[]')}catch(e){return[]}}
function saveHistory(list){try{localStorage.setItem('ehki_history',JSON.stringify(list))}catch(e){}}

function toggleMobileMenu(){
  const nav = document.getElementById('nav-menu');
  const btn = document.getElementById('hamburger-btn');
  nav.classList.toggle('open');
  btn.classList.toggle('open');
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('current',b.dataset.nav===id));
  
  document.getElementById('nav-menu').classList.remove('open');
  document.getElementById('hamburger-btn').classList.remove('open');

  if(id==='progress') renderProgress();
  if(id==='history') renderHistory();
  window.scrollTo({top:0,behavior:'smooth'});
}

function selectLanguage(lang,btn){
  selectedLanguage=lang;
  btn.parentElement.querySelectorAll('.opt').forEach(o=>o.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('level-box').classList.toggle('hidden',lang!=='en');
}
function selectCategory(cat,btn){
  selectedCategory=cat;
  btn.parentElement.querySelectorAll('.opt').forEach(o=>o.classList.remove('active'));
  btn.classList.add('active');
}
function selectLevel(lvl,btn){
  selectedLevel=lvl;
  btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

let wheelRotation = 0;
const colors = ['#EFC85F', '#C88E97', '#9BBBC0', '#F5EFE3', '#D8B4F8', '#A2E8DD'];

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateTopic() {
  const bank = selectedLanguage === 'en' ? englishTopics : arabicTopics;
  let pool = [];
  
  if (selectedCategory === "عشوائي") {
    Object.values(bank).forEach(arr => pool.push(...arr));
  } else {
    pool = bank[selectedCategory] || bank["الشغل"];
  }

  const wheelTopics = [...pool].sort(() => 0.5 - Math.random()).slice(0, Math.min(6, pool.length));
  const winnerIndex = Math.floor(Math.random() * wheelTopics.length);
  const topic = wheelTopics[winnerIndex];

  const wheelEl = document.getElementById('wheel');
  
  wheelEl.innerHTML = '<svg id="wheelSvg" viewBox="0 0 300 300"></svg>';
  const svg = document.getElementById('wheelSvg');

  const n = wheelTopics.length;
  const seg = 360 / n;
  const cx = 150, cy = 150, r = 148;
  let html = '';

  for (let i = 0; i < n; i++) {
    const start = i * seg;
    const end = (i + 1) * seg;
    const [x1, y1] = polarToCartesian(cx, cy, r, start);
    const [x2, y2] = polarToCartesian(cx, cy, r, end);
    const large = seg > 180 ? 1 : 0;
    const color = colors[i % colors.length];

    html += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${color}" stroke="#221B17" stroke-width="2.5"/>`;

    const mid = start + seg / 2;
    const [tx, ty] = polarToCartesian(cx, cy, r * 0.58, mid);
    const dark = '#221B17';

    let labelText = wheelTopics[i];
    if (labelText.length > 22) labelText = labelText.substring(0, 20) + '...';

    let textRotation = mid;
    if (mid > 90 && mid < 270) {
      textRotation = mid + 180;
    }

    html += `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" fill="${dark}" font-size="9.5" font-family="Cairo, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle" transform="rotate(${textRotation},${tx.toFixed(2)},${ty.toFixed(2)})">${escapeXml(labelText)}</text>`;
  }

  svg.innerHTML = html;
  showScreen('wheel-screen');

  const statusTxt = document.getElementById('wheel-status');
  const previewTxt = document.getElementById('wheel-topic-preview');

  statusTxt.textContent = "عم ندور عجلة المواضيع...";
  previewTxt.textContent = "يا ترى شو الموضوع اليوم؟";

  const mid = winnerIndex * seg + seg / 2;
  const extraTurns = 5 + Math.floor(Math.random() * 2); 
  const target = extraTurns * 360 + (360 - mid);

  wheelRotation += target;

  setTimeout(() => {
    wheelEl.style.transform = `rotate(${wheelRotation}deg)`;
  }, 50);

  // Play click sounds while wheel spins
  let clickInterval = setInterval(() => {
    playClickSound();
  }, 180);

  setTimeout(() => {
    clearInterval(clickInterval);
    clickInterval = setInterval(() => {
      playClickSound();
    }, 380);
  }, 2500);

  let counter = 0;
  const interval = setInterval(() => {
    previewTxt.textContent = pool[Math.floor(Math.random() * pool.length)];
    counter++;
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    clearInterval(clickInterval);
    playWinSound();
    statusTxt.textContent = "🎯 تمام! هذا موضوعك:";
    previewTxt.textContent = `"${topic}"`;
    
    setTimeout(() => {
      document.getElementById('current-topic').textContent = topic;
      document.getElementById('language-label').textContent = selectedLanguage === 'en' 
        ? `English • ${selectedLevel} • ${selectedCategory}` 
        : `عربي • ${selectedCategory}`;
      document.getElementById('speaking').dataset.topic = topic;
      document.getElementById('speaking').dataset.category = selectedCategory;
      document.getElementById('speaking').dataset.lang = selectedLanguage;
      resetTimer(); 
      resetRecording();
      document.getElementById('finish-button').disabled = true;
      showScreen('speaking');
    }, 1600);
  }, 4500);
}

function resetTimer(){clearInterval(timerInterval);timerSeconds=120;sessionSeconds=0;updateTimer()}
function updateTimer(){
  const m=String(Math.floor(timerSeconds/60)).padStart(2,'0');
  const s=String(timerSeconds%60).padStart(2,'0');
  document.getElementById('timer').textContent=`${m}:${s}`;
}
function startTimer(){
  timerInterval=setInterval(()=>{
    timerSeconds--; sessionSeconds++; updateTimer();
    if(timerSeconds<=0){clearInterval(timerInterval); stopRecording();}
  },1000);
}

let audioCtx=null, analyser=null, levelRAF=null;

function pickMimeType(){
  const opts=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
  for(const o of opts){ if(window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(o)) return o; }
  return '';
}
function startLevelMeter(stream){
  try{
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const source=audioCtx.createMediaStreamSource(stream);
    analyser=audioCtx.createAnalyser(); analyser.fftSize=256;
    source.connect(analyser);
    const data=new Uint8Array(analyser.frequencyBinCount);
    const bars=document.querySelectorAll('#level-meter .bar');
    const loop=()=>{
      analyser.getByteFrequencyData(data);
      const avg=data.reduce((a,b)=>a+b,0)/data.length;
      const level=Math.min(1,avg/65);
      bars.forEach((bar,i)=>{ bar.style.opacity = level>=(i+1)/bars.length-0.12 ? '1' : '.22'; });
      levelRAF=requestAnimationFrame(loop);
    };
    loop();
  }catch(e){}
}
function stopLevelMeter(){
  if(levelRAF)cancelAnimationFrame(levelRAF);
  if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null;}
  document.querySelectorAll('#level-meter .bar').forEach(b=>b.style.opacity='.22');
}

async function toggleRecording(){
  if(isRecording){stopRecording();return}
  if(location.protocol!=='https:' && !['localhost','127.0.0.1'].includes(location.hostname)){
    alert('التسجيل بيحتاج اتصال آمن (https). افتح الصفحة عبر رابط https أو من سيرفر محلي.');
    return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    audioChunks=[];
    const mimeType=pickMimeType();
    mediaRecorder=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);
    mediaRecorder.ondataavailable=e=>{if(e.data.size>0)audioChunks.push(e.data)};
    mediaRecorder.onstop=()=>{
      const blob=new Blob(audioChunks,{type:mediaRecorder.mimeType||'audio/webm'});
      audioURL=URL.createObjectURL(blob);
      document.getElementById('audio-player').src=audioURL;
      document.getElementById('audio-section').classList.remove('hidden');
      document.getElementById('finish-button').disabled=false;
      stopLevelMeter();
    };
    mediaRecorder.start(); isRecording=true;
    document.getElementById('record-button').classList.add('recording');
    document.getElementById('record-status').textContent='عم تسجل… احكي براحتك 🎙️';
    document.getElementById('level-meter').classList.remove('hidden');
    startLevelMeter(stream);
    startTimer();

    transcript='';
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){
      recognition=new SR();
      recognition.lang = selectedLanguage==='en' ? 'en-US' : 'ar-SA';
      recognition.continuous=true; recognition.interimResults=true;
      recognition.onresult=e=>{
        let chunk='';
        for(let i=e.resultIndex;i<e.results.length;i++){ if(e.results[i].isFinal) chunk+=e.results[i][0].transcript+' '; }
        transcript+=chunk;
      };
      recognition.onerror=()=>{};
      try{ recognition.start(); }catch(e){}
    }
  }catch(err){
    let msg='ما قدرنا نوصل للمايك.';
    if(err&&err.name==='NotAllowedError')msg='لازم تسمح لصفحة "احكي" باستخدام الميكروفون من إعدادات المتصفح.';
    else if(err&&err.name==='NotFoundError')msg='ما لقينا ميكروفون متوصل بالجهاز.';
    alert(msg);
  }
}
function stopRecording(){
  if(!mediaRecorder||!isRecording)return;
  mediaRecorder.stop();
  mediaRecorder.stream.getTracks().forEach(t=>t.stop());
  isRecording=false; clearInterval(timerInterval);
  document.getElementById('record-button').classList.remove('recording');
  document.getElementById('record-status').textContent='خلص التسجيل 🎧';
  document.getElementById('level-meter').classList.add('hidden');
  stopLevelMeter();
  if(recognition){ try{recognition.stop();}catch(e){} recognition=null; }
}
function resetRecording(){
  if(mediaRecorder&&isRecording)stopRecording();
  document.getElementById('audio-section').classList.add('hidden');
  document.getElementById('record-status').textContent='لا تفكر كتير… احكي بس.';
  document.getElementById('finish-button').disabled=true;
  document.getElementById('level-meter').classList.add('hidden');
  resetTimer();
}
function downloadRecording(){
  if(!audioURL)return;
  const a=document.createElement('a'); a.href=audioURL; a.download='my-speaking-session.webm';
  document.body.appendChild(a); a.click(); a.remove();
}

const feedbackBank=[
  {f:"وضّحت فكرتك بشكل جيد وربطت بين الأفكار بطريقة طبيعية. المرة الجاية جرّب توسّع الأمثلة اللي عم تستخدمها.",t:"أعطِ مثالاً حقيقياً يدعم فكرتك."},
  {f:"حكيك كان مرتب وواضح، وبانت عندك أفكار حلوة بس محتاجة شوي تفصيل أكتر.",t:"اشرح كل فكرة بجملتين قبل ما تنتقل للتانية."},
  {f:"صوتك كان واثق والوقفات كانت طبيعية، بس في مساحة تحسّن مفردات أكتر تنوعاً.",t:"جرّب تستخدم مرادف جديد بدل ما تكرر نفس الكلمة."}
];
function mockScores(){return {fluency:70+Math.floor(Math.random()*25),vocab:65+Math.floor(Math.random()*30),grammar:70+Math.floor(Math.random()*25),ideas:75+Math.floor(Math.random()*20)}}
function clampScore(n){n=Math.round(Number(n));return isFinite(n)?Math.max(0,Math.min(100,n)):75}

function setResultLoading(){
  ['s-fluency','s-vocab','s-grammar','s-ideas'].forEach(id=>document.getElementById(id).textContent='…');
  document.getElementById('ai-feedback').textContent='🤔 عم نسمع حكيك ونحلله بالذكاء الاصطناعي… ثواني وبتكون جاهزة.';
  document.getElementById('ai-tip').textContent='';
  document.getElementById('ai-badge').textContent='';
}
function renderResult(scores,feedback,tip,badge){
  document.getElementById('s-fluency').textContent=scores.fluency+'%';
  document.getElementById('s-vocab').textContent=scores.vocab+'%';
  document.getElementById('s-grammar').textContent=scores.grammar+'%';
  document.getElementById('s-ideas').textContent=scores.ideas+'%';
  document.getElementById('ai-feedback').textContent=feedback;
  document.getElementById('ai-tip').textContent=tip;
  document.getElementById('ai-badge').textContent=badge;
}

async function getAIEvaluation(topic,lang,level,text){
  const langLabel = lang==='en' ? `English, learner level ${level}` : 'Arabic (Levantine colloquial)';
  const replyLang = lang==='en' ? 'English' : 'Arabic, Levantine colloquial dialect, warm and casual tone';
  const prompt = `You are a warm, encouraging speaking coach inside a language-practice app called "Yalla Nehki". A learner just spoke out loud about this topic: "${topic}", in ${langLabel}. Below is a speech-to-text transcript of what they said — it may contain transcription mistakes, so be forgiving of odd words and judge the substance, not typos.\n\nTranscript:\n"""${text}"""\n\nScore their spoken response and reply with ONLY a raw JSON object (no markdown fences, no extra text) in exactly this shape:\n{"fluency": <int 0-100>, "vocabulary": <int 0-100>, "grammar": <int 0-100>, "ideas": <int 0-100>, "feedback": "<2-3 encouraging sentences in ${replyLang} about what they did well and one concrete thing to improve>", "tip": "<one short actionable sentence in ${replyLang} for next time>"}`;
  return await claudeSample.json(prompt, {modelTier:'default'});
}

async function finishSpeaking(){
  if(isRecording)stopRecording();
  const sp=document.getElementById('speaking');
  const topic=sp.dataset.topic||document.getElementById('current-topic').textContent;
  const category=sp.dataset.category||selectedCategory;
  const lang=sp.dataset.lang||selectedLanguage;
  const seconds=120-timerSeconds||sessionSeconds;
  const text=transcript.trim();

  showScreen('result');

  let scores,feedback,tip,badge,aiPowered=false;

  if(claudeSample && text.length>8){
    setResultLoading();
    try{
      const data=await getAIEvaluation(topic,lang,selectedLevel,text);
      scores={fluency:clampScore(data.fluency),vocab:clampScore(data.vocabulary),grammar:clampScore(data.grammar),ideas:clampScore(data.ideas)};
      feedback=data.feedback||feedbackBank[0].f; tip=data.tip||feedbackBank[0].t;
      badge='🤖 تقييم حقيقي من Claude بناءً على كلامك الفعلي'; aiPowered=true;
    }catch(e){
      const fb=feedbackBank[Math.floor(Math.random()*feedbackBank.length)];
      scores=mockScores(); feedback=fb.f; tip=fb.t;
      badge = e && e.code==='not_granted' ? 'تقييم تقديري — ما منحك صلاحية استخدام الذكاء الاصطناعي بهالصحة' : 'تقييم تقديري — صار خطأ أثناء التحليل الحقيقي، جرّب مرة تانية.';
    }
  } else {
    const fb=feedbackBank[Math.floor(Math.random()*feedbackBank.length)];
    scores=mockScores(); feedback=fb.f; tip=fb.t;
    badge = claudeSample ? 'تقييم تقديري — المتصفح ما دعم تحويل الصوت لنص، فما قدرنا نبعت حكيك لل AI' : 'تقييم تقديري';
  }

  renderResult(scores,feedback,tip,badge);

  const list=getHistory();
  list.unshift({topic,category,lang,level:selectedLevel,seconds,scores,date:new Date().toISOString(),aiPowered});
  saveHistory(list.slice(0,50));
}

function fmtTime(sec){const m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`}

function renderHistory(){
  const list=getHistory();
  const holder=document.getElementById('hist-list');
  if(!list.length){holder.innerHTML='<div class="empty">لسا ما حكيت عن شي. <br>يلا جرّب أول موضوع ✦</div>';return}
  holder.innerHTML=list.map(item=>`
    <div class="hist-card">
      <div>
        <span class="tag2">${item.lang==='en'?'🇬🇧 English':'🌍 '+item.category}</span>
        <h3>${item.topic}</h3>
        <small>${item.lang==='en'?item.level:'عربي'} • ${fmtTime(item.seconds)}</small>
      </div>
      <button title="عرض التقييم">▶</button>
    </div>`).join('');
}

function renderProgress(){
  const list=getHistory();
  const body=document.getElementById('progress-body');
  if(!list.length){body.innerHTML='<div class="empty">لسا ما بدأت رحلتك. احكي عن موضوع وشوف تقدمك هون ✦</div>';return}
  body.style.display='';
  document.getElementById('p-count').textContent=list.length;
  const avg=Math.round(list.reduce((a,b)=>a+b.seconds,0)/list.length);
  document.getElementById('p-avg').textContent=fmtTime(avg);
  const counts={};
  list.forEach(i=>{counts[i.category]=(counts[i.category]||0)+1});
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('p-top').textContent=top?top[0]:'—';
  const max=Math.max(...Object.values(counts));
  document.getElementById('bars-holder').innerHTML=Object.entries(counts).map(([cat,n])=>`
    <div class="bar-row"><span>${cat}</span><div class="bar-track"><div class="bar-fill" style="width:${(n/max*100)}%"></div></div><span>${n}</span></div>`).join('');
}

renderHistory();