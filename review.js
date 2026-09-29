const STORAGE_KEY='rosh_design_reviews_v1';
const FINAL_KEY='rosh_design_final_v1';
const reviews=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
let currentSection=null,currentRating=0,currentStatus='';
const sections=[...document.querySelectorAll('[data-section-id]')];
const reviewModal=document.getElementById('reviewModal');
const summaryModal=document.getElementById('summaryModal');
const modalName=document.getElementById('modalSectionName');
const comment=document.getElementById('comment');
const stars=[...document.querySelectorAll('#stars button')];
const decisionButtons=[...document.querySelectorAll('.decision-row button')];

function statusMeta(status){
  return status==='approved'?['✅ Aprobado','status-approved']:status==='changes'?['✏️ Modificar','status-changes']:status==='rejected'?['❌ No gusta','status-rejected']:['Sin revisar',''];
}
function renderStars(n){return '★'.repeat(n)+'☆'.repeat(5-n)}
function injectTools(){
  sections.forEach(sec=>{
    const id=sec.dataset.sectionId;
    const tools=document.createElement('div');tools.className='review-tools';
    const saved=reviews[id]; if(saved) tools.classList.add('has-review');
    tools.innerHTML=`<button class="quick ok" title="Me gusta">✅</button><button class="quick edit" title="Modificar">✏️</button><button class="quick no" title="No me gusta">❌</button><button class="open-review" title="Comentar">💬 Opinar</button>`;
    tools.querySelector('.ok').onclick=e=>{e.stopPropagation();openReview(sec,'approved')};
    tools.querySelector('.edit').onclick=e=>{e.stopPropagation();openReview(sec,'changes')};
    tools.querySelector('.no').onclick=e=>{e.stopPropagation();openReview(sec,'rejected')};
    tools.querySelector('.open-review').onclick=e=>{e.stopPropagation();openReview(sec)};
    sec.appendChild(tools);
    if(saved) sec.classList.add('reviewed-outline');
  });
}
function openReview(sec,preset=''){
  currentSection=sec;const id=sec.dataset.sectionId;const saved=reviews[id]||{};
  modalName.textContent=sec.dataset.sectionName;currentRating=saved.rating||0;currentStatus=preset||saved.status||'';comment.value=saved.comment||'';
  paintStars();paintStatus();reviewModal.hidden=false;document.body.style.overflow='hidden';
}
function closeModal(modal){modal.hidden=true;document.body.style.overflow=''}
function paintStars(){stars.forEach((b,i)=>b.classList.toggle('on',i<currentRating))}
function paintStatus(){decisionButtons.forEach(b=>b.classList.toggle('active',b.dataset.status===currentStatus))}
stars.forEach(b=>b.onclick=()=>{currentRating=Number(b.dataset.star);paintStars()});
decisionButtons.forEach(b=>b.onclick=()=>{currentStatus=b.dataset.status;paintStatus()});
document.getElementById('closeReview').onclick=()=>closeModal(reviewModal);
document.getElementById('closeSummary').onclick=()=>closeModal(summaryModal);
reviewModal.addEventListener('click',e=>{if(e.target===reviewModal)closeModal(reviewModal)});
summaryModal.addEventListener('click',e=>{if(e.target===summaryModal)closeModal(summaryModal)});

document.getElementById('saveReview').onclick=()=>{
  if(!currentSection)return;
  if(!currentStatus){alert('Selecciona una opción: Me gusta, Modificar o No me gusta.');return}
  if(!currentRating){alert('Selecciona una calificación de 1 a 5 estrellas.');return}
  const id=currentSection.dataset.sectionId;
  reviews[id]={sectionId:id,sectionName:currentSection.dataset.sectionName,status:currentStatus,rating:currentRating,comment:comment.value.trim(),updatedAt:new Date().toISOString()};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(reviews));currentSection.classList.add('reviewed-outline');
  const tools=currentSection.querySelector('.review-tools');if(tools)tools.classList.add('has-review');
  closeModal(reviewModal);updateProgress();
};

function updateProgress(){
  const done=sections.filter(s=>reviews[s.dataset.sectionId]).length;
  document.getElementById('progressText').textContent=`${done} / ${sections.length} revisadas`;
  document.getElementById('progressFill').style.width=`${(done/sections.length)*100}%`;
}
function openSummary(){
  const list=document.getElementById('summaryList');let sum=0,count=0;
  list.innerHTML=sections.map(sec=>{
    const r=reviews[sec.dataset.sectionId];if(r){sum+=r.rating;count++}
    const [label,klass]=statusMeta(r?.status);
    return `<div class="summary-row"><div><strong>${sec.dataset.sectionName}</strong>${r?.comment?`<div style="font-size:12px;color:#756a64;margin-top:4px">“${escapeHtml(r.comment)}”</div>`:''}</div><span class="status-pill ${klass}">${label}</span><span class="stars-mini">${r?renderStars(r.rating):'—'}</span></div>`;
  }).join('');
  document.getElementById('averageScore').textContent=count?`${(sum/count).toFixed(1)} / 5`:'—';
  const final=JSON.parse(localStorage.getItem(FINAL_KEY)||'null');if(final){const el=document.querySelector(`input[name="final"][value="${final.choice}"]`);if(el)el.checked=true}
  summaryModal.hidden=false;document.body.style.overflow='hidden';
}
document.getElementById('summaryBtn').onclick=openSummary;
document.getElementById('finishReview').onclick=()=>{
  const choice=document.querySelector('input[name="final"]:checked');
  if(!choice){alert('Selecciona una decisión final.');return}
  const done=sections.filter(s=>reviews[s.dataset.sectionId]).length;
  localStorage.setItem(FINAL_KEY,JSON.stringify({choice:choice.value,completedSections:done,totalSections:sections.length,completedAt:new Date().toISOString()}));
  alert('✅ Validación guardada en este navegador. En la siguiente versión conectaremos el envío remoto para que el equipo reciba automáticamente tus comentarios.');closeModal(summaryModal);
};
function escapeHtml(value=''){return value.replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}

// Facilita pruebas: ?review=true mantiene explícito el propósito del enlace.
const params=new URLSearchParams(location.search);if(params.get('review')==='true')document.body.classList.add('review-mode');
injectTools();updateProgress();
