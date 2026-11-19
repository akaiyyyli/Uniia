const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 48000;
const DURATION = 34;
const BPM = 120;
const BEAT = 60 / BPM;
const CHANNELS = 2;
const samples = SAMPLE_RATE * DURATION;
const buffer = Buffer.alloc(44 + samples * CHANNELS * 2);

function writeString(offset, value) { buffer.write(value, offset, 'ascii'); }
writeString(0, 'RIFF');
buffer.writeUInt32LE(36 + samples * CHANNELS * 2, 4);
writeString(8, 'WAVE');
writeString(12, 'fmt ');
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(CHANNELS, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * 2, 28);
buffer.writeUInt16LE(CHANNELS * 2, 32);
buffer.writeUInt16LE(16, 34);
writeString(36, 'data');
buffer.writeUInt32LE(samples * CHANNELS * 2, 40);

let seed = 1837;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function addSine(out, time, frequency, duration, volume, pan = 0, phase = 0) {
  const start = Math.floor(time * SAMPLE_RATE);
  const count = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < count && start + i < samples; i++) {
    const k = i / SAMPLE_RATE;
    const attack = Math.min(1, k / .08);
    const release = Math.min(1, (duration - k) / .12);
    const env = attack * Math.max(0, release);
    const value = Math.sin(2 * Math.PI * frequency * k + phase) * volume * env;
    const left = Math.sqrt((1-pan)/2);
    const right = Math.sqrt((1+pan)/2);
    out[(start+i)*2] += value*left;
    out[(start+i)*2+1] += value*right;
  }
}
function addNoise(out,time,duration,volume,cutoff=.12,pan=0){
  const start=Math.floor(time*SAMPLE_RATE), count=Math.floor(duration*SAMPLE_RATE), previous=0;
  for(let i=0;i<count&&start+i<samples;i++){
    const k=i/SAMPLE_RATE;
    const env=Math.min(1,k/.015)*Math.min(1,(duration-k)/.08);
    const white=random()*2-1;
    const low=(previous*(1-cutoff)+white*cutoff);
    const value=low*volume*env;
    const left=Math.sqrt((1-pan)/2),right=Math.sqrt((1+pan)/2);
    out[(start+i)*2]+=value*left;out[(start+i)*2+1]+=value*right;
  }
}

const mix = new Array(samples*CHANNELS).fill(0);

// Drone em Ré menor.
for(let i=0;i<samples;i++){
  const t=i/SAMPLE_RATE;
  const intro=Math.min(1,t/3)*Math.min(1,(DURATION-t)/2);
  const a=Math.sin(2*Math.PI*73.42*t)*.018;
  const b=Math.sin(2*Math.PI*110*t+.4)*.012;
  mix[i*2]+= (a+b)*intro;
  mix[i*2+1]+= (a+b)*intro;
}

// Pad e notas processadas.
[146.83,220,293.66,349.23].forEach((f,i)=>addSine(mix,7+i*.65,f,4.4,.024-i*.002,.1*i-.15));
[73.42,146.83,174.61,220,261.63].forEach((f,i)=>addSine(mix,16+i*2.2,f,1.15,.018,(i%3-.1)*.25));

// Batidas espaciais de 120 BPM.
for(let beat=0;beat<68;beat++){
  const t=beat*BEAT;
  if(beat%4===0) addSine(mix,t,48,.48,.075,0);
  if(beat>=42 && beat%2===0) addNoise(mix,t,.08,.018,-.2,(beat%4?-.2:.2));
}

// Efeitos sincronizados.
addNoise(mix,.62,1.8,.028,.08,0);
for(let t=.9;t<3.7;t+=.16) addNoise(mix,t,.025,.055,.35,t%0.32-.16);
addNoise(mix,4.2,2.8,.018,.06,0);
[8,10.6,11.8,13.2,19.2,21.8,26.8,31,33.1].forEach((t,i)=>addNoise(mix,t,i===6?.8:.35,i===6?.055:.035,-.2,(i%2-.5)*.5));
[3.85,8.8,12.8,15.8,21.95,26.9,30.9,33.5].forEach((t,i)=>addSine(mix,t,42+i*3,.7,.12,0));

fs.mkdirSync(path.join(__dirname,'audio'),{recursive:true});
let peak=0;
for(let i=0;i<mix.length;i++) peak=Math.max(peak,Math.abs(mix[i]));
const gain=.82/Math.max(peak,.001);
for(let i=0;i<mix.length;i++){
  const s=Math.max(-1,Math.min(1,mix[i]*gain));
  buffer.writeInt16LE(Math.round(s*32767),44+i*2);
}
fs.writeFileSync(path.join(__dirname,'audio','soundtrack.wav'),buffer);
console.log('Created audio/soundtrack.wav');
