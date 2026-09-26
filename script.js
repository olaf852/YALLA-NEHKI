let selectedLanguage="ar", selectedLevel="B1", selectedCategory="عشوائي";
let isRecording=false, timerSeconds=120, timerInterval=null;
let mediaRecorder=null, audioChunks=[], audioURL=null, sessionStart=0, sessionSeconds=0;
let recognition=null, transcript='';
let claudeSample=null;
(async()=>{
  try{ if(window.claude && typeof window.claude.use==='function'){ claudeSample = await window.claude.use('sample'); } }catch(e){}
})();

const arabicTopics={
  "تفكير":["هل التكنولوجيا قرّبت الناس من بعض ولا بعّدتهم؟","هل الذكاء الاصطناعي رح ياخد مكان البشر بالشغل؟","هل الفشل ضروري حتى ننجح؟","هل الحرية المطلقة موجودة أصلاً؟","ليش منخاف من التغيير مع إنه أحياناً بيكون لمصلحتنا؟","هل الصدق دايماً هو أفضل سياسة؟","شو الفرق بين الذكاء والحكمة؟","هل لازم نسامح حتى لو ما اعتذرلنا حدا؟","هل وسائل التواصل غيّرت طريقة تفكيرنا؟","هل القرارات الصعبة لازم تكون سريعة ولا ناخد وقتنا فيها؟"],
  "حياة":["هل المال فعلاً بيشتري السعادة؟","شو المدينة اللي حابب تزورها وليش؟","شو أهم درس تعلمته من أهلك؟","كيف بتوصف حياتك المثالية بعد عشر سنين؟","شو أكتر شي بتقدره بصداقاتك؟","هل الروتين اليومي بيريحك ولا بيضجرك؟","شو أصعب قرار اخدته بحياتك؟","كيف بتوازن بين شغلك وحياتك الشخصية؟","شو العادة اللي بتتمنى تبلّشها من بكرا؟","إذا قدرت تعيش بأي بلد، وين بتختار وليش؟"],
  "إبداع":["شو الشي اللي نفسك تتعلمه وليش؟","لو صممت منتج جديد، شو بيكون؟","لو قدرت تخترع شغلة تسهّل حياة الناس، شو بتكون؟","احكيلي عن فكرة مشروع حلمت فيها يوماً.","لو كتبت كتاب، عن شو بيكون؟","شو الفن اللي بيعبّر عنك أكتر: موسيقى، رسم، ولا كتابة؟","لو صممت مدينة من الصفر، كيف بتكون؟","شو أغرب فكرة خطرت على بالك وحبيت تجربها؟"],
  "عشوائي":["هل الفشل ضروري حتى ننجح؟","لو قدرت تغيّر قرار واحد بحياتك، شو بتغيّر؟","لو فيك تعيش يوم واحد من حياتك من جديد، أي يوم بتختار؟","شو أطرف موقف صار معك؟","لو ربحت مبلغ كبير فجأة، أول شي رح تعمله شو؟","مين الشخص اللي أثّر فيك أكتر بحياتك؟"]
};
const englishTopics={
  "تفكير":["Has technology brought people closer or pushed them apart?","Will AI replace most human jobs?","Is failure necessary for success?","Does true freedom really exist?","Why do we fear change even when it benefits us?","Is honesty always the best policy?","What's the difference between intelligence and wisdom?","Should we forgive even without an apology?","Have social platforms changed how we think?"],
  "حياة":["Does money really buy happiness?","What city would you like to visit, and why?","What's the most important lesson your parents taught you?","How do you picture your ideal life ten years from now?","What do you value most in your friendships?","Does a daily routine comfort you or bore you?","What's the hardest decision you've ever made?","How do you balance work and personal life?"],
  "إبداع":["What is one skill you would love to learn?","If you designed a new product, what would it be?","If you invented something to make life easier, what would it be?","Tell me about a project idea you once dreamed of.","If you wrote a book, what would it be about?","If you designed a city from scratch, what would it look like?"],
  "عشوائي":["What makes a person successful?","If you could change one thing about your life, what would it be?","If you could relive one day of your life, which would you choose?","What's the funniest thing that's ever happened to you?","If you suddenly won a large sum of money, what's the first thing you'd do?","Who is the person who has influenced you the most?"]
};

function getHistory(){try{return JSON.parse(localStorage.getItem('ehki_history')||'[]')}catch(e){return[]}}
function saveHistory(list){try{localStorage.setItem('ehki_history',JSON.stringify(list))}catch(e){}}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('current',b.dataset.nav===id));
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

function generateTopic(){
  const bank=selectedLanguage==='en'?englishTopics:arabicTopics;
  const pool=bank[selectedCategory]||bank["عشوائي"];
  const topic=pool[Math.floor(Math.random()*pool.length)];
  document.getElementById('current-topic').textContent=topic;
  document.getElementById('language-label').textContent=selectedLanguage==='en'?`English • ${selectedLevel} • ${selectedCategory}`:`عربي • ${selectedCategory}`;
  document.getElementById('speaking').dataset.topic=topic;
  document.getElementById('speaking').dataset.category=selectedCategory;
  document.getElementById('speaking').dataset.lang=selectedLanguage;
  resetTimer(); resetRecording();
  document.getElementById('finish-button').disabled=true;
  showScreen('speaking');
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
    alert('التسجيل بيحتاج اتصال آمن (https). افتح الصفحة عبر رابط https أو من سيرفر محلي، مش كملف مباشرة من الجهاز.');
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
      badge = e && e.code==='not_granted' ? 'تقييم تقديري — ما منحك صلاحية استخدام الذكاء الاصطناعي بهالصفحة' : 'تقييم تقديري — صار خطأ أثناء التحليل الحقيقي، جرّب مرة تانية.';
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
