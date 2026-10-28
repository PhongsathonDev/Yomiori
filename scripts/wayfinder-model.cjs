/* Shared by the CLI and the generated, standalone tasks.html. */
(function (root) {
  function links(body, heading) {
    const section = body.split(new RegExp(`^## ${heading}\\s*$`, 'm'))[1]?.split(/^## /m)[0] || '';
    return [...section.matchAll(/\]\((WF-\d+)\.md\)/g)].map(match => match[1]);
  }
  function parse(text, url = '') {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
    if (!match) throw Error('รูปแบบไฟล์งานไม่ถูกต้อง');
    const fields = Object.fromEntries([...match[1].matchAll(/^([a-z_]+):[ \t]*(.*)$/gm)].map(m => [m[1], m[2].trim()]));
    if (!/^WF-\d+$/.test(fields.id) || !fields.title || !['open', 'closed'].includes(fields.state)) throw Error('ข้อมูลรหัส ชื่อ หรือสถานะงานไม่ครบ');
    return { ...fields, body: match[2].trim(), url, blockers: links(match[2], 'Blocked by'), companions: links(match[2], 'Work with') };
  }
  function build(items) {
    const byId = new Map(items.map(item => [item.id, item]));
    const errors = [];
    if (byId.size !== items.length) errors.push('รหัสงานซ้ำ');
    for (const item of items) {
      if (item.parent && byId.get(item.parent)?.labels !== 'wayfinder:map') errors.push(`${item.id}: ไม่พบแผนแม่ ${item.parent}`);
      for (const id of [...item.blockers, ...item.companions]) {
        if (!byId.has(id)) errors.push(`${item.id}: ไม่พบงานอ้างอิง ${id}`);
        if (id === item.id) errors.push(`${item.id}: อ้างอิงตัวเอง`);
      }
      for (const id of item.companions) if (byId.has(id) && !byId.get(id).companions.includes(item.id)) errors.push(`${item.id}: Work with ต้องมีลิงก์กลับจาก ${id}`);
    }
    const visiting = new Set(), visited = new Set();
    function visit(id) {
      if (visiting.has(id)) { errors.push(`dependency วนกลับที่ ${id}`); return; }
      if (visited.has(id)) return;
      visiting.add(id);
      for (const next of byId.get(id)?.blockers || []) if (byId.has(next)) visit(next);
      visiting.delete(id); visited.add(id);
    }
    items.forEach(item => visit(item.id));
    const tasks = items.filter(item => item.labels !== 'wayfinder:map').map(item => {
      const waiting = item.blockers.filter(id => byId.get(id)?.state !== 'closed');
      return { ...item, waiting, status: item.state === 'closed' ? 'closed' : waiting.length ? 'blocked' : item.assignee ? 'claimed' : 'ready' };
    });
    const groups = items.filter(item => item.labels === 'wayfinder:map').map(map => ({ ...map, tasks: tasks.filter(task => task.parent === map.id) }));
    const standalone = tasks.filter(task => !task.parent);
    if (standalone.length) groups.push({ id: 'standalone', title: 'งานแยก / ตรวจรับและส่งมอบ', body: 'งานที่ไม่มีแผนแม่ ไม่ได้หมายความว่าต้องทำพร้อมกัน', tasks: standalone });
    groups.sort((a, b) => Number(b.tasks.some(x => x.state === 'open')) - Number(a.tasks.some(x => x.state === 'open')) || b.id.localeCompare(a.id));
    return { byId, tasks, groups, errors: [...new Set(errors)] };
  }
  function command(group, tasks) {
    return `ทำงานในกลุ่ม «${group.title}»\n${tasks.map(task => `- ${task.title} (${task.id})`).join('\n')}\nอ่านแผนแม่และความสัมพันธ์ Blocked by / Work with ก่อน เริ่มจากงานที่ไม่ติด blocker และยังไม่มีผู้รับผิดชอบ งาน Work with ให้ประสานบริบทร่วมกัน ไม่ได้อนุญาตให้ปิดหลาย decision tickets ใน session เดียว รักษากติกา Wayfinder และอย่าทำงานที่ยังต้องรอ`;
  }
  const model = { parse, build, command };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.Wayfinder = model;
})(globalThis);
