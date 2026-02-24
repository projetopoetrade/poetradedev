const fs = require("fs");

console.log("Reading data.json...");
const data = JSON.parse(fs.readFileSync("data.json", "utf8"));

const nodes = data.nodes;
const groups = data.groups;
const constants = data.constants;

const ORBIT_RADII = constants.orbitRadii;
const SKILLS_PER_ORBIT = constants.skillsPerOrbit;
const CLASS_NAMES = [
  "Scion",
  "Marauder",
  "Ranger",
  "Witch",
  "Duelist",
  "Shadow",
  "Templar",
];

// Extract minimal node data
console.log("Processing nodes...");
const processedNodes = [];
const connections = [];
const classStartNodes = {};

for (const [id, node] of Object.entries(nodes)) {
  if (id === "root") continue;

  const group = groups[node.group];
  if (!group) continue;

  const gx = group.x;
  const gy = group.y;
  const orbit = node.orbit || 0;
  const orbitIndex = node.orbitIndex || 0;
  const radius = ORBIT_RADII[orbit];
  const total = SKILLS_PER_ORBIT[orbit];

  const angle = (2 * Math.PI * orbitIndex) / total - Math.PI / 2;
  const x = gx + radius * Math.cos(angle);
  const y = gy + radius * Math.sin(angle);

  // Check if class start node (names are uppercase like "WITCH", "MARAUDER", etc)
  if (node.name) {
    const upperName = node.name.toUpperCase();
    const classIndex = CLASS_NAMES.findIndex(
      (c) => c.toUpperCase() === upperName,
    );
    if (classIndex !== -1) {
      classStartNodes[classIndex] = parseInt(id);
    }
  }

  processedNodes.push({
    id: parseInt(id),
    x: Math.round(x),
    y: Math.round(y),
    name: node.name || "",
    isNotable: node.isNotable || false,
    isKeystone: node.isKeystone || false,
    stats: node.stats || [],
    ascendancyName: node.ascendancyName || null,
  });

  // Connections - only connect nodes of same ascendancy (or both non-ascendancy)
  if (node.out) {
    for (const outId of node.out) {
      const outNode = nodes[outId];
      if (outNode) {
        const sameAscendancy =
          (node.ascendancyName || null) === (outNode.ascendancyName || null);
        if (sameAscendancy) {
          connections.push([parseInt(id), parseInt(outId)]);
        }
      }
    }
  }
}

console.log(
  `Processed ${processedNodes.length} nodes, ${connections.length} connections`,
);
console.log("Class start nodes:", classStartNodes);

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PoE Skill Tree Viewer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0c0c0c; overflow: hidden; font-family: 'Segoe UI', sans-serif; }
        #canvas { display: block; cursor: grab; }
        #canvas:active { cursor: grabbing; }
        #controls {
            position: fixed; top: 10px; left: 10px;
            background: rgba(20, 20, 20, 0.95); padding: 15px;
            border-radius: 8px; color: #c8c8c8; font-size: 14px;
            border: 1px solid #444; z-index: 100;
        }
        #controls h3 { color: #fff; margin-bottom: 10px; }
        #controls p { margin: 5px 0; font-size: 12px; }
        #controls input {
            width: 100%; padding: 8px; margin-top: 10px;
            background: #1a1a1a; border: 1px solid #444;
            color: #fff; border-radius: 4px;
        }
        #controls button {
            width: 100%; padding: 8px; margin-top: 10px;
            background: #b4a186; border: none; color: #0c0c0c;
            border-radius: 4px; cursor: pointer; font-weight: bold;
        }
        #controls button:hover { background: #c9b896; }
        #tooltip {
            position: fixed; background: rgba(20, 20, 20, 0.98);
            padding: 12px; border-radius: 6px; color: #c8c8c8;
            font-size: 13px; pointer-events: none; display: none;
            z-index: 200; border: 1px solid #444; max-width: 300px;
        }
        #tooltip .name { color: #fff; font-weight: bold; font-size: 15px; }
        #tooltip .notable { color: #af6025; }
        #tooltip .keystone { color: #af6025; font-size: 17px; }
        #tooltip .stats { margin-top: 8px; color: #8888ff; }
        #stats {
            position: fixed; top: 10px; right: 10px;
            background: rgba(20, 20, 20, 0.95); padding: 15px;
            border-radius: 8px; color: #c8c8c8; border: 1px solid #444;
        }
        #stats h3 { color: #fff; }
        #stats span { color: #b4a186; font-weight: bold; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <div id="controls">
        <h3>Skill Tree Viewer</h3>
        <p>Drag to pan | Scroll to zoom | Click to allocate</p>
        <input type="text" id="pob-input" placeholder="Paste PoB code or URL...">
        <button onclick="loadPob()">Load PoB</button>
        <button onclick="generateUrl()" style="background:#6a6a6a;">Generate URL</button>
        <button onclick="allocatedNodes.clear(); render();" style="background:#5a3030;">Clear All</button>
    </div>
    <div id="stats"><h3>Allocated: <span id="count">0</span></h3></div>
    <div id="tooltip"><div class="name"></div><div class="stats"></div></div>

    <script>
    // Pre-processed data
    const NODES = ${JSON.stringify(processedNodes)};
    const CONNECTIONS = ${JSON.stringify(connections)};
    const CLASS_START = ${JSON.stringify(classStartNodes)};
    const CLASS_IDS = { Scion:0, Marauder:1, Ranger:2, Witch:3, Duelist:4, Shadow:5, Templar:6 };
    
    // Index nodes by ID for fast lookup
    const nodeMap = {};
    NODES.forEach(n => nodeMap[n.id] = n);
    
    // State
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let scale = 0.12, offsetX = 0, offsetY = 0;
    let dragging = false, dragX = 0, dragY = 0;
    const allocatedNodes = new Set();
    
    // Bounds
    const minX = ${data.min_x}, maxX = ${data.max_x};
    const minY = ${data.min_y}, maxY = ${data.max_y};
    
    function resize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        if (!offsetX) {
            offsetX = canvas.width / 2 - (minX + maxX) / 2 * scale;
            offsetY = canvas.height / 2 - (minY + maxY) / 2 * scale;
        }
        render();
    }
    
    function worldToScreen(x, y) {
        return { x: x * scale + offsetX, y: y * scale + offsetY };
    }
    
    function screenToWorld(sx, sy) {
        return { x: (sx - offsetX) / scale, y: (sy - offsetY) / scale };
    }
    
    function render() {
        ctx.fillStyle = '#0c0c0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        for (const [id1, id2] of CONNECTIONS) {
            const n1 = nodeMap[id1], n2 = nodeMap[id2];
            if (!n1 || !n2) continue;
            const s1 = worldToScreen(n1.x, n1.y);
            const s2 = worldToScreen(n2.x, n2.y);
            const isActive = allocatedNodes.has(id1) && allocatedNodes.has(id2);
            const isAsc = n1.ascendancyName;
            ctx.strokeStyle = isActive ? (isAsc ? '#88ccff' : '#b4a186') : (isAsc ? '#1a3a5a' : '#2a2a2a');
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
        }
        
        // Draw nodes
        for (const node of NODES) {
            const s = worldToScreen(node.x, node.y);
            const r = Math.max(2, (node.isKeystone ? 16 : node.isNotable ? 10 : 6) * scale);
            
            // Skip off-screen
            if (s.x < -50 || s.x > canvas.width + 50 || s.y < -50 || s.y > canvas.height + 50) continue;
            
            const active = allocatedNodes.has(node.id);
            const isAsc = node.ascendancyName;
            
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            if (active) {
                ctx.fillStyle = isAsc ? '#88ccff' : (node.isKeystone || node.isNotable ? '#af6025' : '#b4a186');
            } else {
                ctx.fillStyle = isAsc ? '#2a4a6a' : (node.isKeystone || node.isNotable ? '#3a2510' : '#4a4a4a');
            }
            ctx.fill();
            ctx.strokeStyle = active ? '#fff' : '#333';
            ctx.lineWidth = Math.max(1, scale);
            ctx.stroke();
        }
        
        document.getElementById('count').textContent = allocatedNodes.size;
    }
    
    function findNode(sx, sy) {
        for (const node of NODES) {
            const s = worldToScreen(node.x, node.y);
            const r = (node.isKeystone ? 20 : node.isNotable ? 14 : 10) * scale;
            const dx = sx - s.x, dy = sy - s.y;
            if (dx * dx + dy * dy < r * r) return node;
        }
        return null;
    }
    
    // Events
    canvas.onmousedown = e => { dragging = true; dragX = e.clientX - offsetX; dragY = e.clientY - offsetY; };
    canvas.onmouseup = () => dragging = false;
    canvas.onmousemove = e => {
        if (dragging) { offsetX = e.clientX - dragX; offsetY = e.clientY - dragY; render(); }
        else {
            const node = findNode(e.clientX, e.clientY);
            const tip = document.getElementById('tooltip');
            if (node) {
                tip.style.display = 'block';
                tip.style.left = (e.clientX + 15) + 'px';
                tip.style.top = (e.clientY + 15) + 'px';
                const nameEl = tip.querySelector('.name');
                nameEl.textContent = node.name || 'Node';
                nameEl.className = 'name' + (node.isNotable ? ' notable' : node.isKeystone ? ' keystone' : '');
                let statsHtml = node.ascendancyName ? '<span style="color:#88ccff">' + node.ascendancyName + '</span><br>' : '';
                statsHtml += node.stats.join('<br>');
                tip.querySelector('.stats').innerHTML = statsHtml;
            } else tip.style.display = 'none';
        }
    };
    canvas.onclick = e => {
        const node = findNode(e.clientX, e.clientY);
        if (node) {
            if (allocatedNodes.has(node.id)) allocatedNodes.delete(node.id);
            else allocatedNodes.add(node.id);
            render();
        }
    };
    canvas.onwheel = e => {
        e.preventDefault();
        const z = e.deltaY > 0 ? 0.9 : 1.1;
        const w = screenToWorld(e.clientX, e.clientY);
        scale = Math.max(0.03, Math.min(3, scale * z));
        const s = worldToScreen(w.x, w.y);
        offsetX += e.clientX - s.x;
        offsetY += e.clientY - s.y;
        render();
    };
    window.onresize = resize;
    
    // PoB loading
    async function loadPob() {
        let code = document.getElementById('pob-input').value.trim();
        if (!code) return;
        
        if (code.startsWith('http')) {
            let url = code;
            if (url.includes('pobb.in') && !url.includes('/pob/')) url = url.replace('pobb.in/', 'pobb.in/pob/');
            if (url.includes('pastebin.com') && !url.includes('/raw/')) url = url.replace('pastebin.com/', 'pastebin.com/raw/');
            code = await fetch(url).then(r => r.text());
        }
        
        code = code.replace(/-/g, '+').replace(/_/g, '/');
        while (code.length % 4) code += '=';
        
        // Decompress
        const binary = atob(code);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const xml = new TextDecoder().decode(pako.inflate(bytes));
        
        // Parse XML
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const nodesStr = doc.querySelector('Tree Spec')?.getAttribute('nodes') || '';
        
        allocatedNodes.clear();
        const ids = nodesStr.split(',').filter(Boolean);
        let sumX = 0, sumY = 0, count = 0;
        
        for (const id of ids) {
            const node = nodeMap[parseInt(id)];
            if (node) {
                allocatedNodes.add(parseInt(id));
                sumX += node.x;
                sumY += node.y;
                count++;
            }
        }
        
        if (count > 0) {
            offsetX = canvas.width / 2 - sumX / count * scale;
            offsetY = canvas.height / 2 - sumY / count * scale;
        }
        render();
    }
    
    // Generate URL
    function generateUrl() {
        const hashes = [...allocatedNodes].filter(id => !Object.values(CLASS_START).includes(id)).sort((a,b) => a-b);
        const buf = new ArrayBuffer(7 + hashes.length * 2 + 2);
        const view = new DataView(buf);
        let o = 0;
        view.setUint32(o, 6, false); o += 4;
        view.setUint8(o++, 0);
        view.setUint8(o++, 0);
        view.setUint8(o++, hashes.length);
        for (const h of hashes) { view.setUint16(o, h, false); o += 2; }
        view.setUint16(o, 0, false);
        
        const url = 'https://www.pathofexile.com/passive-skill-tree/' + 
            btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
        
        navigator.clipboard.writeText(url);
        alert('URL copied!\\n\\n' + url);
    }
    
    resize();
    </script>
    <script src="pako.min.js"></script>
</body>
</html>`;

fs.writeFileSync("viewer.html", html);
console.log("Generated viewer.html");
console.log(
  `File size: ${(fs.statSync("viewer.html").size / 1024).toFixed(1)} KB`,
);
