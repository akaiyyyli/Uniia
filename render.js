const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WIDTH=1920, HEIGHT=1080, FPS=60, DURATION=34;
const args=process.argv.slice(2);
const preview=args.includes('--preview');
const outFps=preview?30:FPS;
const total=preview?1020:DURATION*FPS;
const project=__dirname;
const framesDir=path.join(project,'previews','frames');
const contactDir=path.join(project,'previews');
const renderDir=path.join(project,'render');
const outputDir=path.join(project,'output');
for(const dir of [framesDir,renderDir,outputDir,contactDir])fs.mkdirSync(dir,{recursive:true});

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--disable-gpu']});
  const page=await browser.newPage({viewport:{width:WIDTH,height:HEIGHT},deviceScaleFactor:1});
  await page.goto(`file://${path.join(project,'index.html')}`);
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>window.seek(0));

  const captureTimes=[0,2,5,8,11,14,18,24,28,32.5];
  const contact=[];

  for(let i=0;i<total;i++){
    const t=preview?(i/(outFps-1))*DURATION:(i/FPS);
    await page.evaluate(t=>window.seek(t),t);
    await page.screenshot({path:path.join(framesDir,`frame-${String(i).padStart(5,'0')}.png`) ,omitBackground:true});
    if(i%(preview?102:204)===0) process.stdout.write(`frame ${i+1}/${total}\r`);
  }

  for(let i=0;i<captureTimes.length;i++){
    await page.evaluate(t=>window.seek(t),captureTimes[i]);
    const p=path.join(contactDir,`preview-${String(i+1).padStart(2,'0')}-${captureTimes[i].toString().replace('.','_')}s.png`);
    await page.screenshot({path:p});
    contact.push(p);
  }

  await browser.close();

  execFileSync('ffmpeg',['-y','-framerate',String(outFps),'-i',path.join(framesDir,'frame-%05d.png'),'-i',path.join(project,'audio','soundtrack.wav'),'-t',String(DURATION),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r',String(outFps),'-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart',preview?path.join(project,'previews','preview.mp4'):path.join(project,'output','FRAGMENTOS_DO_ACASO_PARTE_II.mp4')],{stdio:'inherit'});

  if(preview && contact.length){
    execFileSync('ffmpeg',['-y','-pattern_type','glob','-i',path.join(contactDir,'preview-*.png'),'-vf','tile=5x2','-frames:v','1',path.join(contactDir,'contact-sheet.jpg')],{stdio:'inherit'});
  }

  console.log(preview?'Preview created':'Final video created');
})().catch(e=>{console.error(e);process.exit(1)});
