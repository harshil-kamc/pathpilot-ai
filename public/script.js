// --- GLOBAL STATE ---
let chatHistory = [];
let uploadedFileData = null; 

let educationArray = [];
let achievementsArray = [];
let skillsArray = [];
let interestsArray = [];

// NEW: Globals for dynamic comparison and charts
let globalCareersData = []; 
let demandChartInstance = null;

function showSection(id) {
  // 1. Switch the main content section
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  // 2. Remove the 'active' highlight from ALL sidebar tabs
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

  // 3. Add the 'active' highlight ONLY to the tab that was just clicked
  const activeTab = document.querySelector(`.nav-item[onclick="showSection('${id}')"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
}

function showManualForm() {
  document.getElementById('manualForm').classList.toggle('hidden');
}

// --- DYNAMIC FORM LOGIC ---

// Education
function addEducation() {
  const level = document.getElementById("eduLevel").value.trim();
  const domain = document.getElementById("eduDomain").value.trim();
  const school = document.getElementById("eduSchool").value.trim();

  if (!level || !domain || !school) return alert("Please fill all 3 Education fields before adding.");

  educationArray.push({ level, domain, school });
  document.getElementById("eduLevel").value = "";
  document.getElementById("eduDomain").value = "";
  document.getElementById("eduSchool").value = "";
  renderEducation();
}

function renderEducation() {
  const list = document.getElementById("eduList");
  list.innerHTML = educationArray.map((e, index) =>
    `<div style="background:#1e293b; border:1px solid #334155; padding:8px; border-radius:6px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
       <span style="color:#e2e8f0;">🎓 ${e.level} - ${e.domain} (${e.school})</span>
       <button onclick="removeEdu(${index})" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">✖</button>
     </div>`
  ).join('');
}

function removeEdu(index) {
  educationArray.splice(index, 1);
  renderEducation();
}

// Achievements
function addAchievement() {
  const ach = document.getElementById("achieveInput").value.trim();
  if (!ach) return;
  achievementsArray.push(ach);
  document.getElementById("achieveInput").value = "";
  renderAchievements();
}

function renderAchievements() {
  const list = document.getElementById("achieveList");
  list.innerHTML = achievementsArray.map((a, index) =>
    `<div style="background:#1e293b; border:1px solid #334155; padding:8px; border-radius:6px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
       <span style="color:#e2e8f0;">🏆 ${a}</span>
       <button onclick="removeAch(${index})" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">✖</button>
     </div>`
  ).join('');
}

function removeAch(index) {
  achievementsArray.splice(index, 1);
  renderAchievements();
}

// Skills
function addSkill() {
  const skill = document.getElementById("skillInput").value.trim();
  if (!skill) return;
  skillsArray.push(skill);
  document.getElementById("skillInput").value = "";
  renderSkills();
}

function renderSkills() {
  const list = document.getElementById("skillsList");
  list.innerHTML = skillsArray.map((s, index) =>
    `<div style="background:#1e293b; border:1px solid #334155; padding:8px; border-radius:6px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
       <span style="color:#e2e8f0;">⚡ ${s}</span>
       <button onclick="removeSkill(${index})" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">✖</button>
     </div>`
  ).join('');
}

function removeSkill(index) {
  skillsArray.splice(index, 1);
  renderSkills();
}

// Interests
function addInterest() {
  const interest = document.getElementById("interestInput").value.trim();
  if (!interest) return;
  interestsArray.push(interest);
  document.getElementById("interestInput").value = "";
  renderInterests();
}

function renderInterests() {
  const list = document.getElementById("interestsList");
  list.innerHTML = interestsArray.map((i, index) =>
    `<div style="background:#1e293b; border:1px solid #334155; padding:8px; border-radius:6px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
       <span style="color:#e2e8f0;">❤️ ${i}</span>
       <button onclick="removeInterest(${index})" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">✖</button>
     </div>`
  ).join('');
}

function removeInterest(index) {
  interestsArray.splice(index, 1);
  renderInterests();
}

// --- AI ANALYSIS LOGIC ---
async function handleResumeUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const base64String = event.target.result.split(',')[1];
    uploadedFileData = { data: base64String, mimeType: file.type || 'application/pdf' };
    alert("Resume loaded successfully! AI is analyzing your profile...");
    startAnalysis(true);
  };
  reader.readAsDataURL(file);
}

// UPDATED: Added Rupee/INR strict rule here
async function startAnalysis(hasFile = false) {
  const role = document.getElementById('currentRole').value || "Resume Candidate";
  document.getElementById('current-position').textContent = role;
  showSection('chat');
  
  // What the AI sees
  const hiddenPrompt = hasFile 
    ? `I have attached my resume. Analyze it carefully and give me a deeply branching flowchart of all possible career pathways. CRITICAL RULE: You must provide all salary estimates and financial figures in Indian Rupees (₹ / INR). Format them according to the Indian numbering system (e.g., ₹5,00,000 - ₹12,00,000). Do not use USD or Dollars.`
    : `Analyze my career: I am a ${role}. Give me an extensive branching flowchart of career pathways. CRITICAL RULE: You must provide all salary estimates and financial figures in Indian Rupees (₹ / INR). Format them according to the Indian numbering system (e.g., ₹5,00,000 - ₹12,00,000). Do not use USD or Dollars.`;
    
  // What the User sees in the chatbox
  const displayMsg = hasFile 
    ? `📄 *Resume attached.* Please analyze my profile and generate career pathways.`
    : `Please analyze my career as a ${role} and generate career pathways.`;

  // Pass both to the sender function
  sendMessageWithText(hiddenPrompt, uploadedFileData, displayMsg);
  uploadedFileData = null; 
}

// UPDATED: Added Rupee/INR strict rule here
async function startDetailedAnalysis() {
  const roleOrName = document.getElementById("currentRole").value || "Student";
  
  let eduText = educationArray.map(e => `${e.level} in ${e.domain} at ${e.school}`).join(", ") || "Not specified";
  let achText = achievementsArray.join(", ") || "Not specified";
  let skillsText = skillsArray.join(", ") || "Not specified";
  let interestsText = interestsArray.join(", ") || "Not specified";

  document.getElementById('current-position').textContent = roleOrName;
  showSection('chat');

  // What the AI sees
  const hiddenPrompt = `Analyze my profile carefully. 
  Name/Role: ${roleOrName}.
  Education History: ${eduText}.
  Achievements & Certifications: ${achText}.
  Skills: ${skillsText}.
  Interests: ${interestsText}.
  Based strictly on this data, generate an extensive, highly-personalized branching flowchart of career pathways extending to job roles with salary, demand, and automation risk. Do not limit the pathways.
  
  CRITICAL RULE: You must provide all salary estimates and financial figures in Indian Rupees (₹ / INR). Format them according to the Indian numbering system (Lakhs/Crores, e.g., ₹5,00,000 - ₹12,00,000). Do not use USD or Dollars.`;

  // What the User sees
  const displayMsg = `🛠️ *Manual Profile Submitted.* Please analyze my details and generate career pathways.`;

  sendMessageWithText(hiddenPrompt, null, displayMsg);
}
// --- API & CHAT LOGIC ---
async function connectApiKey() {
  const key = document.getElementById('apikey').value.trim();
  if (!key) return alert("Enter API key");

  const status = document.getElementById('status');
  status.textContent = "Connecting...";

  try {
    const res = await fetch('/api/set-key', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ apiKey: key })
    });
    const data = await res.json();
    status.style.color = data.success ? '#4ade80' : '#ef4444';
    status.textContent = data.message;
  } catch (e) {
    status.textContent = "Connection failed";
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  sendMessageWithText(msg);
  input.value = '';
}

// Note the new "displayMsg" parameter at the end
async function sendMessageWithText(msg, fileData = null, displayMsg = null) {
  const chatbox = document.getElementById('chatbox');
  
  // Show the clean version to the user, but fallback to the raw message if it's a normal chat
  addChatMessage("You", displayMsg ? displayMsg : msg);

  const typing = document.createElement('p');
  typing.id = 'typing';
  typing.innerHTML = `<strong>PathForge AI:</strong> Analyzing and drawing flowchart...`;
  chatbox.appendChild(typing);
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    // Send the HIDDEN prompt (msg) to the backend API
    const res = await fetch('/api/chat', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: msg, history: chatHistory, file: fileData })
    });
    const data = await res.json();

    document.getElementById('typing').remove();

    if (data.success) {
      addChatMessage("PathForge AI", data.reply);
      // Save the hidden prompt to history so the AI remembers the rules!
      chatHistory.push({ role: "user", content: msg });
      chatHistory.push({ role: "assistant", content: data.reply });

      if (data.pathways && data.pathways.length > 0) {
          renderPathways(data.pathways);
          processGeminiPathways(data.pathways);
      }
      if (data.showResults) {
        setTimeout(() => showSection('results'), 1000);
      }
    } else {
      addChatMessage("PathForge AI", data.reply);
    }
  } catch (e) {
    if (document.getElementById('typing')) document.getElementById('typing').remove();
    addChatMessage("PathForge AI", "Error connecting to AI.");
  }
}

function addChatMessage(sender, text) {
  const chatbox = document.getElementById('chatbox');
  const p = document.createElement('p');
  const isUser = sender === 'You';
  p.className = isUser ? 'msg-user' : 'msg-ai';
  p.innerHTML = `<strong>${sender}</strong><span class="msg-text">${text.replace(/\n/g, '<br>')}</span>`;
  chatbox.appendChild(p);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// --- FLOWCHART RENDERER ---
function buildTreeHTML(pathways) {
  if (!pathways || pathways.length === 0) return '';
  let html = `<ul>`;
  
  pathways.forEach(path => {
    html += `<li>`;
    html += `<div class="path-card" style="display:inline-block; text-align:left; min-width: 150px;">
              <h3 style="color:#60a5fa; margin-bottom:8px; font-size:16px;">${path.role}</h3>`;
    if (path.salary) html += `<p style="font-size:12px; margin-bottom:3px;"><strong>💰 Salary:</strong> ${path.salary}</p>`;
    if (path.demand) html += `<p style="font-size:12px; margin-bottom:3px;"><strong>📈 Demand:</strong> ${path.demand}</p>`;
    if (path.automationRisk) html += `<p style="font-size:12px; margin-bottom:3px;"><strong>🤖 Risk:</strong> ${path.automationRisk}</p>`;
    html += `</div>`;
    
    if (path.nextRoles && path.nextRoles.length > 0) {
      html += buildTreeHTML(path.nextRoles);
    }
    html += `</li>`;
  });
  
  html += `</ul>`;
  return html;
}

function renderPathways(pathways) {
  const container = document.getElementById('pathways');
  container.innerHTML = `<div class="tree">` + buildTreeHTML(pathways) + `</div>`;
}

// --- DYNAMIC COMPARE & CHART LOGIC ---
function processGeminiPathways(pathways) {
  // Store AI output into our global array
  globalCareersData = pathways;
  
  setupCompareCheckboxes();
  renderDemandChart();
}

function setupCompareCheckboxes() {
  const container = document.getElementById('compareCheckboxes');
  if(!container) return; // Guard clause in case HTML isn't updated
  
  container.innerHTML = ''; 

  globalCareersData.forEach((career, index) => {
    const label = document.createElement('label');
    label.className = 'compare-checkbox-label';
    label.innerHTML = `
      <input type="checkbox" value="${index}" class="career-checkbox">
      ${career.role}
    `;
    container.appendChild(label);
  });
  
  const grid = document.getElementById('compareGrid');
  if(grid) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
  }
}

// Ensure toggleSection is defined
function toggleSection(sectionId) {
  const el = document.getElementById(sectionId);
  if(el) el.classList.toggle('hidden');
}

function generateComparison() {
  const checkboxes = document.querySelectorAll('.career-checkbox:checked');
  if (checkboxes.length < 2) {
    alert("Please select at least 2 careers to compare.");
    return;
  }

  const grid = document.getElementById('compareGrid');
  grid.innerHTML = ''; 
  grid.classList.remove('hidden');

  checkboxes.forEach(box => {
    const career = globalCareersData[box.value];
    
    const card = document.createElement('div');
    card.className = 'compare-card';
    card.innerHTML = `
      <h4>${career.role}</h4>
      <div class="compare-stat">
        <span class="compare-stat-label">💰 Est. Salary:</span>
        <span class="compare-stat-value" style="color: #22c55e;">${career.salary || "N/A"}</span>
      </div>
      <div class="compare-stat">
        <span class="compare-stat-label">🤖 Automation Risk:</span>
        <span class="compare-stat-value">${career.automationRisk || "N/A"}</span>
      </div>
      <div class="compare-stat">
        <span class="compare-stat-label">📈 Market Demand:</span>
        <span class="compare-stat-value">${career.demand || "N/A"}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderDemandChart() {
  const canvasEl = document.getElementById('demandChart');
  if(!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  
  if (demandChartInstance) {
    demandChartInstance.destroy(); 
  }

  const labels = globalCareersData.map(c => c.role);
  
  // Convert text demand ("High", "Low") to numerical score for chart
  const dataScores = globalCareersData.map(c => {
    const demandText = (c.demand || "").toLowerCase();
    if (demandText.includes("high")) return 90;
    if (demandText.includes("medium") || demandText.includes("stable")) return 60;
    if (demandText.includes("low")) return 30;
    return 50; 
  });

  demandChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Market Demand Score (Est)',
        data: dataScores,
        backgroundColor: 'rgba(59, 130, 246, 0.6)', 
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f8fafc' } }
      }
    }
  });
}

// --- EXPORT PDF ---
async function exportPDF() {
  if (!window.jspdf) {
      alert("PDF library is loading, please try again in a second.");
      return;
  }
  const { jsPDF } = window.jspdf;
  const element = document.getElementById('pdf-container'); 
  
  alert("Generating PDF, please wait...");
  
  try {
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f172a' });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('PathForge_Career_Flowchart.pdf');
  } catch (error) {
    console.error("PDF Export failed:", error);
    alert("Failed to export PDF.");
  }
}

window.onload = () => {
  showSection('home');
  updateProfileUI(); // <-- Add this line!
  document.getElementById('chat-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
};

// --- LOGIN & PROFILE SYSTEM ---

function openLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
}

function submitLogin() {
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  
  if (!username) return alert("Please enter a username.");
  
  // Save user session in browser storage
  localStorage.setItem('pathforge_user', username);
  
  // Clear inputs and close
  document.getElementById('usernameInput').value = '';
  document.getElementById('passwordInput').value = '';
  closeLoginModal();
  
  // Update UI
  updateProfileUI();
}

function handleLogout() {
  localStorage.removeItem('pathforge_user');
  updateProfileUI();
}

function updateProfileUI() {
  const savedUser = localStorage.getItem('pathforge_user');
  
  const profileName = document.getElementById('profileName');
  const profileStatus = document.getElementById('profileStatus');
  const sidebarLoginBtn = document.getElementById('sidebarLoginBtn');
  const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
  const topLoginBtn = document.getElementById('topLoginBtn');

  if (savedUser) {
    // Logged In State
    profileName.textContent = savedUser;
    profileStatus.textContent = "Online";
    profileStatus.style.color = "var(--success)"; // Green
    
    if(sidebarLoginBtn) sidebarLoginBtn.classList.add('hidden');
    if(topLoginBtn) topLoginBtn.classList.add('hidden');
    if(sidebarLogoutBtn) sidebarLogoutBtn.classList.remove('hidden');
  } else {
    // Guest State
    profileName.textContent = "Guest";
    profileStatus.textContent = "Not logged in";
    profileStatus.style.color = "#94a3b8"; // Gray
    
    if(sidebarLoginBtn) sidebarLoginBtn.classList.remove('hidden');
    if(topLoginBtn) topLoginBtn.classList.remove('hidden');
    if(sidebarLogoutBtn) sidebarLogoutBtn.classList.add('hidden');
  }
  
}
// ====================== HISTORY FUNCTIONS ======================

let simulationHistory = [];

function loadHistory() {
  const saved = localStorage.getItem('pathpilot_history');
  if (saved) {
    simulationHistory = JSON.parse(saved);
  }
  renderHistory();
}

function saveToHistory(prompt, reply, pathways = []) {
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    prompt: prompt.length > 100 ? prompt.substring(0, 97) + "..." : prompt,
    fullPrompt: prompt,
    reply: reply.length > 150 ? reply.substring(0, 147) + "..." : reply,
    fullReply: reply,
    pathways: pathways
  };

  simulationHistory.unshift(entry); // newest first

  // Keep only last 15 entries
  if (simulationHistory.length > 15) simulationHistory.pop();

  localStorage.setItem('pathpilot_history', JSON.stringify(simulationHistory));
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;

  if (simulationHistory.length === 0) {
    container.innerHTML = `<p class="no-history">No previous simulations yet.<br>Start analyzing your career to see history here.</p>`;
    return;
  }

  let html = '';
  simulationHistory.forEach(item => {
    html += `
      <div class="history-item" onclick="loadPastSimulation(${item.id})">
        <div class="history-date">${item.date}</div>
        <div class="history-prompt">${item.prompt}</div>
        <div class="history-reply-preview">${item.reply}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function loadPastSimulation(id) {
  const entry = simulationHistory.find(h => h.id === id);
  if (!entry) return;

  showSection('chat');
  
  // Clear current chat and load past conversation
  const chatbox = document.getElementById('chatbox');
  chatbox.innerHTML = '';

  addChatMessage("You", entry.fullPrompt);
  addChatMessage("PathPilot", entry.fullReply);

  // Restore pathways if they exist
  if (entry.pathways && entry.pathways.length > 0) {
    renderPathways(entry.pathways);
    processGeminiPathways(entry.pathways);
  }

  // Close sidebar
  document.getElementById('sidebar').classList.remove('open');
}
