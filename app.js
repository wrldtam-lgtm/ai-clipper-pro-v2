const $=id=>document.getElementById(id);
let file=null, videoUrl=null, ffmpeg=null, clips=[];
const input=$('videoInput'), preview=$('preview');
function showError(msg){$('errorBox').hidden=false;$('errorBox').textContent=msg}
function clearError(){$('errorBox').hidden=true;$('errorBox').textContent=''}
function fmt(s){s=Math.max(0,Math.floor(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
input.addEventListener('change',e=>loadFile(e.target.files[0]));
const dz=$('dropzone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.style.borderColor='#a78bfa'});
dz.addEventListener('dragleave',()=>dz.style.borderColor='');
dz.addEventListener('drop',e=>{e.preventDefault();dz.style.borderColor='';loadFile(e.dataTransfer.files[0])});
function loadFile(f){if(!f)return;if(!f.type.startsWith('video/'))return showError('Pilih file video yang valid.');file=f;clearError();if(videoUrl)URL.revokeObjectURL(videoUrl);videoUrl=URL.createObjectURL(f);preview.src=videoUrl;$('previewEmpty').hidden=true;$('fileMeta').textContent=`${f.name} • ${(f.size/1024/1024).toFixed(1)} MB`;$('analyzeBtn').disabled=false;$('exportBtn').disabled=false;preview.onloadedmetadata=()=>{$('endTime').value=Math.min(15,preview.duration).toFixed(1);$('startTime').value=0};$('downloadLink').hidden=true;$('suggestions').innerHTML='';clips=[]}
$('setEnd').onclick=()=>{$('endTime').value=preview.currentTime.toFixed(1)};
$('setStart').onclick=()=>{$('startTime').value=preview.currentTime.toFixed(1)};
$('analyzeBtn').onclick=async()=>{if(!file)return;const status=$('analysisStatus');status.textContent='Menganalisis tingkat audio…';$('suggestions').innerHTML='';try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const buf=await file.arrayBuffer();const audio=await ctx.decodeAudioData(buf);const data=audio.getChannelData(0),rate=audio.sampleRate,step=Math.floor(rate*2),scores=[];for(let p=0;p<data.length;p+=step){let sum=0,n=Math.min(step,data.length-p);for(let j=0;j<n;j+=8)sum+=data[p+j]*data[p+j];scores.push({t:p/rate,v:Math.sqrt(sum/Math.max(1,Math.ceil(n/8)))});}const ranked=scores.map((x,i)=>({start:Math.max(0,x.t-5),end:Math.min(audio.duration,x.t+7),score:x.v})).filter(x=>x.end-x.start>=3).sort((a,b)=>b.score-a.score);clips=[];for(const r of ranked){if(clips.every(c=>Math.abs(c.start-r.start)>7))clips.push(r);if(clips.length===4)break}clips.sort((a,b)=>a.start-b.start);$('suggestions').innerHTML=clips.map((c,i)=>`<div class="suggestion"><span>Momen ${i+1} · ${fmt(c.start)}–${fmt(c.end)}</span><button data-i="${i}">Pakai</button></div>`).join('')||'Tidak ditemukan momen audio.';$('suggestions').querySelectorAll('button').forEach(b=>b.onclick=()=>{let c=clips[+b.dataset.i];$('startTime').value=c.start.toFixed(1);$('endTime').value=c.end.toFixed(1);preview.currentTime=c.start});status.textContent='Selesai • saran berdasarkan volume audio';await ctx.close()}catch(e){status.textContent='Analisis audio tidak didukung untuk file ini. Coba MP4 dengan audio AAC.';}}
async function getFFmpeg(){if(ffmpeg)return ffmpeg;if(!window.FFmpegWASM||!window.FFmpegUtil)throw new Error('Mesin video gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.');const {FFmpeg}=FFmpegWASM;const {toBlobURL}=FFmpegUtil;ffmpeg=new FFmpeg();ffmpeg.on('progress',({progress})=>{const p=Math.max(0,Math.min(100,Math.round(progress*100)));$('progressBar').style.width=p+'%';$('progressText').textContent=`Memproses video… ${p}%`});const base='https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';await ffmpeg.load({coreURL:await toBlobURL(base+'/ffmpeg-core.js','text/javascript'),wasmURL:await toBlobURL(base+'/ffmpeg-core.wasm','application/wasm')});return ffmpeg}
$('exportBtn').onclick=async()=>{if(!file)return;clearError();$('exportBtn').disabled=true;$('progressArea').hidden=false;$('downloadLink').hidden=true;$('progressBar').style.width='0%';try{const start=Number($('startTime').value)||0,end=Number($('endTime').value)||0;if(end<=start||end>preview.duration+0.2)throw new Error('Waktu akhir harus lebih besar dari waktu mulai dan tidak melebihi durasi video.');$('progressText').textContent='Memuat mesin video… (pertama kali bisa agak lama)';const f=await getFFmpeg();const ext=(file.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'');const inName='input.'+ext;await f.writeFile(inName,await FFmpegUtil.fetchFile(file));const args=['-ss',String(start),'-i',inName,'-t',String(end-start)];const ratio=$('ratio').value;if(ratio==='9:16')args.push('-vf',"scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2");if(ratio==='1:1')args.push('-vf',"scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2");if(ratio==='16:9')args.push('-vf',"scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2");const txt=$('overlayText').value.trim();if(txt){const safe=txt.replace(/\\/g,'\\\\').replace(/:/g,'\\:').replace(/'/g,"\\'").replace(/%/g,'\\%');args.push('-vf',`drawtext=text='${safe}':fontcolor=white:fontsize=36:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.78`)}const q=$('quality').value;args.push('-c:v','libx264','-preset',q==='high'?'slow':'ultrafast','-crf',q==='small'?'29':q==='high'?'20':'24','-c:a','aac','-b:a','128k','-movflags','+faststart','output.mp4');await f.exec(args);const data=await f.readFile('output.mp4');const blob=new Blob([data.buffer],{type:'video/mp4'});const url=URL.createObjectURL(blob);const a=$('downloadLink');a.href=url;a.download='ai-clipper-pro.mp4';a.hidden=false;$('progressBar').style.width='100%';$('progressText').textContent='Selesai! Video siap diunduh.';}catch(e){showError(e.message||String(e));$('progressText').textContent='Ekspor gagal.'}finally{$('exportBtn').disabled=false}};
if('serviceWorker'in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});


// Import URL: direct media files only when the source permits cross-origin fetching.
function youtubeId(value){
 try{
  const u=new URL(value);
  if(u.hostname==='youtu.be') return u.pathname.split('/').filter(Boolean)[0]||null;
  if(u.hostname.endsWith('youtube.com')){
   if(u.pathname==='/watch') return u.searchParams.get('v');
   const m=u.pathname.match(/^\/(embed|shorts)\/([^/?]+)/); return m?m[2]:null;
  }
 }catch(e){}
 return null;
}
$('sourceType').addEventListener('change',()=>{
 const yt=$('sourceType').value==='youtube';
 $('sourceUrl').placeholder=yt?'https://www.youtube.com/watch?v=...':'https://example.com/video.mp4';
 $('youtubeNotice').hidden=!yt;
 $('youtubePreview').hidden=true;
 $('urlStatus').textContent=yt?'YouTube hanya dapat dipratinjau melalui pemutar resmi.':'Link MP4/WebM langsung dapat dicoba jika server mengizinkan CORS.';
});
$('loadUrlBtn').addEventListener('click',async()=>{
 clearError();
 const raw=$('sourceUrl').value.trim(),type=$('sourceType').value;
 if(!raw){$('urlStatus').textContent='Masukkan URL terlebih dahulu.';return}
 if(type==='youtube'){
  const id=youtubeId(raw);
  if(!id){$('urlStatus').textContent='Link YouTube tidak dikenali.';return}
  $('youtubePreview').innerHTML='';
  const frame=document.createElement('iframe');
  frame.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id);
  frame.title='Pratinjau YouTube';frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;
  $('youtubePreview').appendChild(frame);$('youtubePreview').hidden=false;$('youtubeNotice').hidden=false;
  $('urlStatus').textContent='Pratinjau resmi siap. Untuk mengedit, gunakan file video yang kamu miliki atau punya izin untuk mengunduh.';
  return;
 }
 let u;
 try{u=new URL(raw);if(!['http:','https:'].includes(u.protocol))throw new Error()}catch(e){$('urlStatus').textContent='URL tidak valid. Gunakan alamat http:// atau https://';return}
 $('urlStatus').textContent='Mengambil file video…';
 try{
  const response=await fetch(u.href,{mode:'cors'});
  if(!response.ok)throw new Error('Server mengembalikan status '+response.status);
  const blob=await response.blob();
  if(!blob.type.startsWith('video/')&&!/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u.pathname))throw new Error('URL ini tidak terlihat seperti file video MP4/WebM.');
  if(blob.size===0)throw new Error('File video kosong.');
  const name=(u.pathname.split('/').pop()||'video-import.mp4').replace(/[^a-zA-Z0-9._-]/g,'_');
  const imported=new File([blob],name,{type:blob.type||'video/mp4'});
  loadFile(imported);
  $('urlStatus').textContent='Video berhasil diimpor. Sekarang atur klip dan ekspor.';
 }catch(e){
  $('urlStatus').textContent='Tidak dapat mengimpor link: '+e.message+'. Server mungkin memblokir CORS, memerlukan login, atau URL bukan file video langsung. Unduh file secara resmi lalu upload dari perangkat.';
 }
});
