const SAFETY_MINUTES = 15;
const routesEl = document.querySelector('#routes');
const template = document.querySelector('#route-template');

function addRoute(from = '', to = '', duration = 20) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.querySelector('.from').value = from;
  node.querySelector('.to').value = to;
  node.querySelector('.duration').value = duration;
  node.querySelector('.remove').addEventListener('click', () => node.remove());
  routesEl.appendChild(node);
}

function parseTime(value) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(totalMinutes) {
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function calculate() {
  const arrivalValue = document.querySelector('#arrival').value;
  const prep = Math.max(0, Number(document.querySelector('#prep').value) || 0);
  if (!arrivalValue) return;

  const routes = [...routesEl.querySelectorAll('.route')].map(row => ({
    from: row.querySelector('.from').value.trim() || 'Départ',
    to: row.querySelector('.to').value.trim() || 'Destination',
    duration: Math.max(0, Number(row.querySelector('.duration').value) || 0)
  }));

  const totalTravel = routes.reduce((sum, r) => sum + r.duration, 0);
  const arrival = parseTime(arrivalValue);
  const wake = arrival - totalTravel - prep - SAFETY_MINUTES;
  const leaveHome = wake + prep;

  document.querySelector('#wake').textContent = formatTime(wake);
  document.querySelector('#summary').innerHTML = `Préparation : <strong>${prep} min</strong> · Trajets : <strong>${totalTravel} min</strong> · Sécurité : <strong>${SAFETY_MINUTES} min</strong><br>Premier départ prévu vers <strong>${formatTime(leaveHome)}</strong>.`;

  const timeline = document.querySelector('#timeline');
  timeline.innerHTML = '';
  const events = [{ time: wake, text: 'Réveil' }, { time: leaveHome, text: 'Prête à partir' }];
  let cursor = leaveHome;
  routes.forEach((route, index) => {
    events.push({ time: cursor, text: `Départ : ${route.from}` });
    cursor += route.duration;
    events.push({ time: cursor, text: `Arrivée : ${route.to}` });
  });
  events.push({ time: arrival - SAFETY_MINUTES, text: 'Marge de sécurité de 15 min' });
  events.push({ time: arrival, text: 'Heure d’arrivée obligatoire' });

  const dedup = events.filter((e, i, arr) => i === 0 || e.time !== arr[i-1].time || e.text !== arr[i-1].text);
  for (const event of dedup) {
    const div = document.createElement('div');
    div.className = 'step';
    div.innerHTML = `<div class="time">${formatTime(event.time)}</div><div>${event.text}</div>`;
    timeline.appendChild(div);
  }

  document.querySelector('#result').hidden = false;
  document.querySelector('#result').scrollIntoView({behavior:'smooth', block:'start'});
  localStorage.setItem('reveil-lory', JSON.stringify({arrival: arrivalValue, prep, routes}));
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem('reveil-lory'));
    if (!saved) throw new Error();
    document.querySelector('#arrival').value = saved.arrival || '07:00';
    document.querySelector('#prep').value = saved.prep ?? 30;
    (saved.routes?.length ? saved.routes : [{from:'Chez moi',to:'Chez ses parents',duration:20},{from:'Chez ses parents',to:'Travail',duration:20}])
      .forEach(r => addRoute(r.from, r.to, r.duration));
  } catch {
    addRoute('Chez moi', 'Chez ses parents', 20);
    addRoute('Chez ses parents', 'Travail', 20);
  }
}

document.querySelector('#add').addEventListener('click', () => addRoute());
document.querySelector('#calculate').addEventListener('click', calculate);
restore();
