// Learn Together – prototype (HTML + CSS + JavaScript, data kept in localStorage)
const KEY = 'learnTogetherV1';
const seed = {
  people: [
    {id:'p1', name:'Aarav Shah',   branch:'IT, Sem 7',  role:'mentor',  skills:['python','data structures','dbms']},
    {id:'p2', name:'Meera Patel',  branch:'CE, Sem 5',  role:'mentor',  skills:['web development','react','javascript']},
    {id:'p3', name:'Kunal Desai',  branch:'IT, Sem 7',  role:'mentor',  skills:['computer networks','linux','cyber security']},
    {id:'p4', name:'Riya Joshi',   branch:'IT, Sem 3',  role:'learner', skills:['python','data structures']},
    {id:'p5', name:'Dhruv Mehta',  branch:'EC, Sem 5',  role:'learner', skills:['web development','dbms']}
  ],
  sessions: [
    {id:'s1', topic:'Python basics for first years', when:'2026-11-02T17:00', mode:'Library', host:'Aarav Shah', hostId:'p1', joined:[]},
    {id:'s2', topic:'DBMS exam revision: normalization', when:'2026-11-04T16:30', mode:'Online', host:'Meera Patel', hostId:'p2', joined:[]}
  ],
  requests: [],
  me: null
};
let state = JSON.parse(localStorage.getItem(KEY) || 'null') || seed;
let roleFilter = 'all';
const $ = s => document.querySelector(s);
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = p => p + Date.now().toString(36) + Math.floor(Math.random()*99);
const person = id => state.people.find(p => p.id === id);
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
const tagsHtml = a => '<div class="tags">' + a.map(s => '<span>'+esc(s)+'</span>').join('') + '</div>';

/* ---------- Topic finder (matching) ---------- */
function findMentors(query){
  const words = query.toLowerCase().split(/[,\s]+/).filter(w => w.length > 1);
  if (!words.length) return [];
  return state.people.filter(p => p.role === 'mentor' && (!state.me || p.id !== state.me.id))
    .map(p => ({p, score: words.filter(w => p.skills.some(s => s.includes(w))).length}))
    .filter(x => x.score > 0).sort((a,b) => b.score - a.score);
}
function renderFinder(){
  const q = $('#topicInput').value.trim(), box = $('#finderResults');
  if (!q){ box.innerHTML = ''; return; }
  const m = findMentors(q);
  box.innerHTML = m.length ? m.map(x => '<li><div><strong>'+esc(x.p.name)+'</strong><small>'+esc(x.p.branch)+' – '+esc(x.p.skills.join(', '))+'</small></div><button class="small" data-ask="'+x.p.id+'" data-topic="'+esc(q)+'">Ask for help</button></li>').join('')
    : '<li>No mentor knows this yet. Join and be the first to teach it.</li>';
}

/* ---------- Students ---------- */
function renderPeople(){
  const list = state.people.filter(p => roleFilter === 'all' || p.role === roleFilter);
  $('#peopleList').innerHTML = list.map(p => '<article class="card"><span class="badge '+p.role+'">'+(p.role==='mentor'?'Can teach':'Wants to learn')+'</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.branch)+'</p>'+tagsHtml(p.skills)+
    (p.role==='mentor' && !(state.me && state.me.id===p.id) ? '<button class="small" data-ask="'+p.id+'" data-topic="">Ask for help</button>' : '')+'</article>').join('');
}

/* ---------- Requests ---------- */
function askForHelp(mentorId, topic){
  if (!state.me) { toast('Create your profile first'); location.hash = '#join'; return; }
  const m = person(mentorId);
  const t = topic || prompt('What do you need help with?', m.skills[0]);
  if (!t) return;
  state.requests.push({id:uid('r'), fromId:state.me.id, toId:mentorId, topic:t, status:'pending'});
  save(); renderRequests(); toast('Request sent to '+m.name);
}
function renderRequests(){
  const box = $('#requestList');
  if (!state.me){ box.innerHTML = '<p class="note">Create your profile to send or receive help requests.</p>'; return; }
  const mine = state.requests.filter(r => r.fromId === state.me.id || r.toId === state.me.id);
  box.innerHTML = mine.length ? mine.map(r => {
    const incoming = r.toId === state.me.id, other = person(incoming ? r.fromId : r.toId);
    const actions = incoming && r.status === 'pending' ? '<span><button class="small" data-set="'+r.id+'" data-val="accepted">Accept</button> <button class="small" data-set="'+r.id+'" data-val="declined">Decline</button></span>' : '';
    return '<div class="card row"><div><strong>'+(incoming?esc(other.name)+' asked you about ':'You asked '+esc(other.name)+' about ')+esc(r.topic)+'</strong><p class="status '+r.status+'">'+r.status[0].toUpperCase()+r.status.slice(1)+'</p></div>'+actions+'</div>';
  }).join('') : '<p class="note">No requests yet. Search a topic above and ask a mentor for help.</p>';
}

/* ---------- Sessions ---------- */
function renderSessions(){
  const sorted = [...state.sessions].sort((a,b) => a.when.localeCompare(b.when));
  $('#sessionList').innerHTML = sorted.map(s => {
    const joined = state.me && s.joined.includes(state.me.id), mine = state.me && s.hostId === state.me.id;
    return '<div class="card row"><div><strong>'+esc(s.topic)+'</strong><p>'+new Date(s.when).toLocaleString([], {dateStyle:'medium', timeStyle:'short'})+', '+esc(s.mode)+' – hosted by '+esc(s.host)+' ('+s.joined.length+' joined)</p></div>'+
      '<button class="small" data-join="'+s.id+'" '+(joined||mine?'disabled':'')+'>'+(mine?'You host this':joined?'Joined':'Join session')+'</button></div>';
  }).join('') || '<p class="note">No sessions yet. Host the first one.</p>';
}

/* ---------- Profile ---------- */
function renderMe(){
  $('#meBox').textContent = state.me ? 'You are signed in as '+state.me.name+' ('+(state.me.role==='mentor'?'can teach':'wants to learn')+').' : '';
  $('#sessionNote').hidden = !!state.me;
}
function renderAll(){ renderFinder(); renderPeople(); renderRequests(); renderSessions(); renderMe(); }

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.ask !== undefined) askForHelp(b.dataset.ask, b.dataset.topic);
  if (b.dataset.set){ state.requests.find(r => r.id === b.dataset.set).status = b.dataset.val; save(); renderRequests(); toast('Request '+b.dataset.val); }
  if (b.dataset.join){
    if (!state.me){ toast('Create your profile first'); location.hash = '#join'; return; }
    state.sessions.find(s => s.id === b.dataset.join).joined.push(state.me.id); save(); renderSessions(); toast('You joined the session');
  }
  if (b.dataset.role){
    roleFilter = b.dataset.role;
    document.querySelectorAll('#roleFilter .chip').forEach(c => c.classList.toggle('on', c === b));
    renderPeople();
  }
});
$('#topicInput').addEventListener('input', renderFinder);

$('#joinForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const skills = f.get('skills').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const p = {id:uid('u'), name:f.get('name').trim(), branch:f.get('branch').trim(), role:f.get('role'), skills};
  state.people.push(p); state.me = p;
  if (p.role === 'mentor')   // sample request so a new mentor can try Accept / Decline
    state.requests.push({id:uid('r'), fromId:'p4', toId:p.id, topic:skills[0], status:'pending'});
  save(); e.target.reset(); renderAll(); toast('Welcome, '+p.name); location.hash = '#people';
});

$('#sessionForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.me){ toast('Create your profile first'); location.hash = '#join'; return; }
  const f = new FormData(e.target);
  state.sessions.push({id:uid('s'), topic:f.get('topic').trim(), when:f.get('when'), mode:f.get('mode'), host:state.me.name, hostId:state.me.id, joined:[]});
  save(); e.target.reset(); renderSessions(); toast('Session created');
});

/* ---------- Dark / light mode ---------- */
function setTheme(t){ document.documentElement.dataset.theme = t; $('#themeBtn').textContent = t === 'dark' ? 'Light mode' : 'Dark mode'; localStorage.setItem('ltTheme', t); }
$('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
setTheme(localStorage.getItem('ltTheme') || 'light');
renderAll();
