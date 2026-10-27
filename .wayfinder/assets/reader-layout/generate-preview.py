"""Generate a browser layout companion. This is NOT an Android screenshot."""
from pathlib import Path
import html
import json
import re

root = Path(__file__).resolve().parents[3]
target = Path(__file__).parent
chapter = json.loads((root / 'reader-mobile/src/data/novels/kyudo-senpai/chapters/ch-69.json').read_text(encoding='utf-8'))
characters = json.loads((root / 'reader-mobile/src/data/novels/kyudo-senpai/characters.json').read_text(encoding='utf-8'))
cast = {character['id']: character for character in characters}
theme_source = (root / 'reader-mobile/src/theme/colors.ts').read_text(encoding='utf-8')
themes = {}
for name in ['light', 'dark', 'sepia']:
    section = theme_source.split(f'  {name}: {{')[1].split('\n  },')[0]
    themes[name] = dict(re.findall(r"(\w+): '([^']*)'", section))

paths = {'back': '<path d="m12 19-7-7 7-7m-7 7h14"/>', 'prev': '<path d="m15 18-6-6 6-6"/>',
         'next': '<path d="m9 18 6-6-6-6"/>', 'list': '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
         'type': '<path d="M4 7V4h16v3M12 4v16m-4 0h8"/>', 'eye': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
         'hide': '<path d="m3 3 18 18M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/>'}
def icon(name):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths[name]}</svg>'

blocks = []
for block in chapter['blocks'][:24]:
    text = html.escape(block.get('text', ''))
    if block['type'] == 'narration':
        blocks.append(f'<p>{text}</p>')
    elif block['type'] == 'dialogue':
        character = cast.get(block['speakerId'], {})
        color = character.get('color', '#b84a5f')
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', color): color = '#b84a5f'
        name = html.escape(block['speakerName'])
        role = html.escape(character.get('role', ''))
        blocks.append(f'<section class="dialogue" style="--speaker:{color}"><div class="speaker"><i>{name[:1]}</i><b>{name}</b><small>{role}</small></div><div>“{text.strip(chr(34) + chr(0x201c) + chr(0x201d))}”</div></section>')
    elif block['type'] == 'scene_break':
        blocks.append('<div class="scene">◆</div>')

template = '''<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reader layout companion — not a native capture</title>
<style>
@font-face{font-family:Sarabun;src:url('/reader-mobile/node_modules/@expo-google-fonts/sarabun/400Regular/Sarabun_400Regular.ttf')}
@font-face{font-family:Sarabun;src:url('/reader-mobile/node_modules/@expo-google-fonts/sarabun/700Bold/Sarabun_700Bold.ttf');font-weight:700}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font-family:Tahoma,sans-serif}button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}svg{width:22px;height:22px;flex-shrink:0}.status{position:fixed;inset:0 0 auto;height:24px;background:var(--background);z-index:40;display:flex;justify-content:space-between;padding:5px 20px;font-size:11px}.progress{position:fixed;top:24px;left:0;right:0;height:3px;z-index:30;background:var(--progressTrack)}.progress:after{content:'';display:block;height:100%;width:50%;background:var(--primary)}
header{position:fixed;top:27px;left:0;right:0;z-index:10;background:var(--background);border-bottom:1px solid var(--border);padding:8px}.header-inner{max-width:720px;margin:auto;display:flex;gap:8px;align-items:center}.icon{min-width:48px;min-height:48px;display:grid;place-items:center}.titles{flex:1;min-width:0}.titles div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.novel{font-size:12px;color:var(--textMuted);line-height:18px}.chapter{font-size:14px;font-weight:bold;line-height:20px}
main{position:fixed;inset:0;overflow:auto;padding:116px 24px 158px}article{max-width:min(720px,calc(var(--size)*36px));margin:auto;width:100%;font-family:Sarabun,sans-serif}h1{font-size:22px;line-height:32px;text-align:left;margin:0 0 22px;padding-bottom:18px;border-bottom:1px solid var(--border)}p,.dialogue{font-size:calc(var(--size)*1px);line-height:1.85}p{margin:0 0 calc(var(--size)*.85px);color:var(--narrationText)}.dialogue{background:color-mix(in srgb,var(--speaker) 4%,transparent);border-left:3.5px solid var(--speaker);border-radius:0 10px 10px 0;padding:10px 14px;margin-bottom:14px}.speaker{display:flex;align-items:center;gap:10px;min-height:48px;margin-bottom:6px;color:var(--speaker);flex-wrap:wrap}.speaker i{width:26px;height:26px;border:1.5px solid var(--speaker);border-radius:50%;font-size:11px;display:grid;place-items:center;font-style:normal}.speaker b{font-size:clamp(14px,calc(var(--size)*.8px),18px)}.speaker small{font-size:clamp(11px,calc(var(--size)*.55px),13px);background:color-mix(in srgb,var(--speaker) 8%,transparent);padding:2px 7px;border-radius:10px}.scene{text-align:center;color:var(--textMuted);margin:20px 0}
.dock{position:fixed;bottom:0;left:0;right:0;z-index:10;background:var(--card);border-top:1px solid var(--border);padding:4px 16px 24px}.dock-inner{max-width:648px;margin:auto}.row{display:flex;align-items:center;gap:8px;min-height:48px;font-size:12px}.position{flex:1;color:var(--textMuted)}.percent{color:var(--primary);font-weight:bold}.actions{display:flex;gap:8px;align-items:stretch}.action{flex:1;min-width:48px;min-height:48px;border-radius:12px;background:var(--primaryBg);color:var(--primary);padding:8px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:12px;line-height:18px}.reveal{display:none;position:fixed;bottom:24px;right:16px;border-radius:24px;border:1px solid var(--border);background:var(--card);color:var(--primary);min-height:48px;align-items:center;gap:8px;padding:0 16px;z-index:12;font-size:12px}.hidden-chrome header,.hidden-chrome .dock{opacity:0;pointer-events:none}.hidden-chrome .reveal{display:flex}
.overlay{position:fixed;inset:0;z-index:50;background:#0008;display:flex;align-items:flex-end;justify-content:center}.overlay[hidden]{display:none}.sheet{max-height:85vh;width:100%;max-width:520px;background:var(--card);border:1px solid var(--cardBorder);border-radius:24px 24px 0 0;padding:18px 20px 30px;display:flex;flex-direction:column}.sheet-head{display:flex;gap:8px;align-items:flex-start;margin-bottom:14px}.sheet-head strong{font-size:18px;line-height:28px;flex:1}.settings-body{overflow:auto}.label{color:var(--textMuted);font-size:12px;margin-bottom:8px}.group{margin-bottom:18px}.themes{display:flex;gap:8px}.themes button{flex:1;min-width:48px;min-height:64px;border:1px solid var(--border);border-radius:12px;font-size:12px}.themes button.selected{border-color:var(--primary)}.preview{font:calc(var(--size)*1px)/1.85 Sarabun;background:var(--background);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:16px}.size-row{display:flex;align-items:center;justify-content:space-between;padding:0 8px}.size-row button{width:48px;height:48px;border-radius:24px;background:var(--primaryBg);color:var(--primary);font-size:22px}.font-choice{padding:10px 14px;margin-bottom:8px;border:1px solid var(--border);border-radius:10px;font-size:14px}.font-choice small{display:block;font-size:11px;margin-top:2px;color:var(--textMuted)}.pills{display:flex;gap:8px}.pills button{flex:1;min-height:48px;border:1px solid var(--border);border-radius:10px;font-size:13px}.pills .selected{background:var(--primary);color:white}@media(max-width:399px){main{padding-left:16px;padding-right:16px}}
</style>
<div class="status"><span>9:41</span><span>▮▮▮ &nbsp; 100%</span></div><div class="progress"></div>
<header><div class="header-inner"><button class="icon" aria-label="กลับ">__BACK__</button><div class="titles"><div class="novel">__NOVEL__</div><div class="chapter">__TITLE__</div></div><button class="icon" aria-label="เปิดสารบัญ">__LIST__</button></div></header>
<main><article><h1>__TITLE__</h1>__BODY__</article></main>
<div class="dock"><div class="dock-inner"><div class="row"><span class="position">70 / 73 ในสารบัญ</span><span class="percent">50%</span><button class="icon" aria-label="ซ่อนเครื่องมือ" onclick="toggle()">__HIDE__</button></div><div class="actions"><button class="icon" aria-label="ก่อนหน้า">__PREV__</button><button class="action">__LIST__<span>สารบัญ</span></button><button class="action" onclick="document.querySelector('.overlay').hidden=false">__TYPE__<span>ตั้งค่า</span></button><button class="icon" aria-label="ถัดไป">__NEXT__</button></div></div></div>
<button class="reveal" onclick="toggle()">__EYE__เครื่องมือ</button>
<div class="overlay" hidden onclick="if(event.target===this)this.hidden=true"><div class="sheet"><div class="sheet-head"><strong>ตั้งค่าการอ่าน</strong><button class="icon" onclick="document.querySelector('.overlay').hidden=true">✕</button></div><div class="settings-body"><div class="group"><div class="label">ธีม</div><div class="themes"><button data-theme="light" onclick="setTheme('light')">สว่าง</button><button data-theme="sepia" onclick="setTheme('sepia')">โทนอุ่น</button><button data-theme="dark" onclick="setTheme('dark')">มืด</button></div></div><div class="preview">นี่คือตัวอย่างการแสดงผลสำหรับอ่านนิยาย “โยมิโอริ” ในรูปแบบรูปเล่ม</div><div class="group"><div class="label">ขนาดตัวอักษร</div><div class="size-row"><button onclick="setSize(size-1)">−</button><span id="size-value"></span><button onclick="setSize(size+1)">+</button></div></div><div class="group"><div class="label">แบบอักษร</div><div class="font-choice">สารบรรณ (Sarabun)<small>สไตล์วรรณกรรมสิ่งพิมพ์ อ่อนช้อย สบายตา</small></div><div class="font-choice">คณิต (Kanit)<small>โมเดิร์น ไร้หัว คมชัด อ่านง่าย</small></div><div class="font-choice">พร้อม (Prompt)<small>เรขาคณิต เรียบหรู ทรงพลัง</small></div><div class="font-choice">ระบบเครื่อง (System)<small>ฟอนต์เริ่มต้นของอุปกรณ์</small></div></div><div class="group"><div class="label">ระยะห่างบรรทัด</div><div class="pills"><button>กระชับ</button><button class="selected">มาตรฐาน</button><button>โปร่งสบาย</button></div></div></div></div></div>
<script>const themes=__THEMES__;const params=new URLSearchParams(location.search);let size=17;function setSize(value){size=Math.max(14,Math.min(26,value));document.documentElement.style.setProperty('--size',size);document.getElementById('size-value').textContent=size+' pt'}function setTheme(name){const selected=themes[name]||themes.light;for(const [key,value]of Object.entries(selected))document.documentElement.style.setProperty('--'+key,value);document.querySelectorAll('[data-theme]').forEach(el=>el.classList.toggle('selected',el.dataset.theme===name))}function toggle(){document.body.classList.toggle('hidden-chrome')}document.querySelector('main').addEventListener('click',toggle);setSize(Number(params.get('size')||17));setTheme(params.get('theme')||'light');document.querySelector('.overlay').hidden=params.get('sheet')!=='1';</script>
</html>'''
values = {'NOVEL': html.escape(chapter['novelTitle']), 'TITLE': html.escape(chapter['title']), 'BODY': '\n'.join(blocks), 'THEMES': json.dumps(themes)}
values.update({name.upper(): icon(name) for name in paths})
for key, value in values.items(): template = template.replace(f'__{key}__', value)
(target / 'preview.html').write_text(template, encoding='utf-8')
print(target / 'preview.html')
