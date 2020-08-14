const hashesRaw = ['00000000a8ed5e960dccdf309f2ee2132badcc9247755c32a4b7081422d51899',
                '0000000000000083ee9371ddff055eed7f02348e4eda36c741a2fc62c85bc5cf',
                '0000000000000001eac750e8f6b9226e009856cbea1f9e05ed5874056218deea',
                '000000000000000182927604c67126f3aa8d6abb0ef4e696e284d54201038dc9',
                '0000000000000000cfc62406981740caa815b7c2fd795f92168b3205f9a0aee3',
                '0000000000000000c03b7c0002a89065d42fa85bca2eb343b03c763584dde30a',
                '00000000000000001e8d6829a8a21adc5d38d0a473b144b6765798e61f98bd1d',
                '0000000000000000038f499dee2b3dd7cf426f466ef95a1f5f3d80b8fb349f50',
                '00000000000000000e47cc21d2c964f8acdd217603849f8fd4bb13b1f04b3d9a',
                '000000000000000000c48417ec6947d235044440926dd4454ec65a0afc13bf0d',
                '000000000000000000accc37dfca7b0f97cad385d9edd48a42d56a070df33e2e',
                '000000000000000000a3938051664293252d8bcca07fb6ed3b3ebb6cac26daf4',
                '0000000000000000003979727d629b2318a1964f24ccc5d9cb902656e0cd51aa',
                '000000000000000000a582aba3845a060f2e0eb9136b386ec88fa1acccfbd49b',
                '000000000000000000ace3e3dfcd0a4b39d14b68decb86bff70842d9f139e8f7'];

let hashes = [];
let geometry;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( window.devicePixelRatio );

document.body.appendChild(renderer.domElement);

const vertexShader = document.querySelector('#vertex-shader').textContent;
const fragmentShader = document.querySelector('#fragment-shader').textContent;

const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    amplitude: { value: 1.0 }
  },
  vertexColors: THREE.VertexColors
});

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 0, 70);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x151c19 );

let whereInString = 0;

let lastRandom = 0;
let hashCounter = 0;

setInterval(() => {
  while(scene.children.length > 0){
      scene.remove(scene.children[0]);
  }

  if(hashes.length >= hashesRaw.length * 4) {
    hashes = [];
  }

  hashes.push(hashesRaw[hashCounter]);
  hashCounter++;
  hashCounter %= hashesRaw.length;
  constructCurve();
}, 1000);

animate();

function animate() {
  requestAnimationFrame( animate );
	render();
}

function render() {
  const time = Date.now() * 0.0005;

  //console.log(scene.children);

  camera.position.x = 200 * Math.cos(time);
  camera.position.y = 200 * Math.sin(time);
  camera.lookAt( scene.position );

  //shaderMaterial.uniforms.time.value = time % (2 * Math.PI);
  const randomAmplitude = (Math.random() - 0.5) / 2;

  shaderMaterial.uniforms.amplitude.value = randomAmplitude * 0.5 + lastRandom * 0.5;
  shaderMaterial.uniforms.needsUpdate = true;

  renderer.render(scene, camera);

  lastRandom = randomAmplitude;
}

function constructCurve() {
  let origin = new THREE.Vector3(0, 0, 0);
  let lastPoint = new THREE.Vector3();

  hashes.forEach((hash, hashIndex) => {
    let curvePoints = [];
    curvePoints.push(origin);

    lastPoint.copy(origin);

    for(let i = 0; i < hash.length; i+=4) {
      const x = parseInt(hash.charAt(i), 16)-7.5;
      const y = parseInt(hash.charAt(i+1), 16)-7.5;
      const z = parseInt(hash.charAt(i+2), 16)-7.5;
      const s = parseInt(hash.charAt(i+3), 16);

      let nextPoint = new THREE.Vector3();
      nextPoint.copy(lastPoint).add((new THREE.Vector3(x, y, z)).normalize().multiplyScalar(s));

      curvePoints.push(nextPoint);
      //curvePoints.push((new THREE.Vector3(x, y, z)).normalize().multiplyScalar(s));

      lastPoint.copy(nextPoint);
    }


    const curve = new THREE.CatmullRomCurve3(curvePoints);

    const points = curve.getPoints( 300 );
    const color = new THREE.Color();

    let colors = [];
    points.forEach((p, index) => {
      const hexColor = hash.substring(hash.length-6, hash.length);
      color.setHex(parseInt(hexColor, 16));
      const hsl = color.getHSL();
      color.setHSL(hsl.h + Math.random()*0.3, hsl.s,  0.2+index/points.length/2 );
      colors.push(color.r, color.g, color.b);
    });

    geometry = new THREE.BufferGeometry().setFromPoints( points );
    geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

    //const material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 3, vertexColors: THREE.VertexColors, blending: THREE.AdditiveBlending, transparent: true } );

    // Create the final object to add to the scene
    const curveObject = new THREE.Line( geometry, shaderMaterial );

    const displacement = new Float32Array( geometry.attributes.position.count );

    for ( let i = 0; i < displacement.length; i ++ ) {
      displacement[ i ] = Math.random() * 20;
    }
    geometry.addAttribute( 'displacement', new THREE.BufferAttribute( displacement, 1 ) );

    scene.add(curveObject);

    origin.copy(curvePoints[curvePoints.length-1]);
  } );
}


let audioCtx = null;
let usingWebAudio = true;

usingWebAudio = true;

try {
  if (typeof AudioContext !== 'undefined') {
      audioCtx = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
      audioCtx = new webkitAudioContext();
  } else {
      usingWebAudio = false;
  }
} catch(e) {
    usingWebAudio = false;
}

console.log(usingWebAudio);
console.log(audioCtx);

if (usingWebAudio && audioCtx.state === 'suspended') {
  console.log("in using webaudio && audioCtx.state");
  var resume = function () {
    console.log("resuming");
    audioCtx.resume();

    setTimeout(function () {
      if (audioCtx.state === 'running') {
        //document.body.removeEventListener('touchend', resume, false);
      }
    }, 0);
  };

}

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};


$(document).ready(function() {
  var images = ['face-1.jpg', 'face-2.jpg', 'face-3.jpg', 'face-4.jpg', 'face-5.jpg', 'face-6.jpg', 'face-7.jpg'];

  $('.set-background').css({'background-image': 'url(http://mirthandco.com/faces/' + images[Math.floor(Math.random() * images.length)] + ')'});
});

const oscillator = audioCtx.createOscillator();
const droneOsci = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();
const lowPass = audioCtx.createBiquadFilter();
const tremolo = audioCtx.createOscillator();
const distortion = audioCtx.createWaveShaper();
const preDistGain = audioCtx.createGain();
const delay = audioCtx.createDelay();
const feedbackGain = audioCtx.createGain();
feedbackGain.gain.value = 0.35;

delay.delayTime.value = 0.5;

distortion.curve = makeDistortionCurve(400);

oscillator.connect(preDistGain);
preDistGain.connect(distortion);
distortion.connect(lowPass);
lowPass.connect(gainNode);
gainNode.connect(delay);
delay.connect(audioCtx.destination);
delay.connect(feedbackGain);
feedbackGain.connect(delay);
gainNode.connect(audioCtx.destination);

oscillator.type = 'sawtooth';
oscillator.frequency.value = 60; // value in hertz
oscillator.start();

droneOsci.type = 'triangle';
droneOsci.frequency.value = 60;
//droneOsci.start();


lowPass.type = "highpass";
lowPass.frequency.value = 880;
lowPass.Q.value = 3;

tremolo.type = 'sawtooth';
tremolo.frequency.value = 1.5;
tremolo.start();
//tremolo.connect(gainNode.gain);

const HALF_HASH_LENGTH = 32;

let freqCounter = 0;
let offsetFreqCounter = 0;

setInterval(() => {
  const hash = hashesRaw[freqCounter];
  const frequency = parseInt(hash.substring(offsetFreqCounter * 2, offsetFreqCounter *2 + 2), 16)/16 + 60;

  const Q = parseInt(hash.substring(offsetFreqCounter * 2, offsetFreqCounter *2 + 2), 16)/16;

  oscillator.frequency.value = frequency;
  lowPass.Q.value = Q;
  freqCounter++;
  freqCounter %= hashesRaw.length;

  const now = audioCtx.currentTime;
  const randomTimeOffset = Math.random() * 0.02;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1, now + 0.005 + randomTimeOffset );
  gainNode.gain.linearRampToValueAtTime(0, now + 0.02 - randomTimeOffset);

  offsetFreqCounter++;
  offsetFreqCounter %= HALF_HASH_LENGTH;
}, 100);

let filterCounter = 0;
let offsetFilterCounter = HALF_HASH_LENGTH / 2;
setInterval(() => {
  const hash = hashesRaw[filterCounter];
  const cutoff = parseInt(hash.substring(offsetFilterCounter * 2, offsetFilterCounter *2 + 2), 16)*8 + 50;

  lowPass.frequency.value = cutoff;

  //console.log(cutoff);
  filterCounter++;
  filterCounter %= hashesRaw.length;

  offsetFilterCounter++;
  offsetFilterCounter %= HALF_HASH_LENGTH;
}, 167);

let distCounter = hashesRaw.length - 1;
let offsetDistCounter = 0;
setInterval(() => {
  const hash = hashesRaw[distCounter];
  const distGain = parseInt(hash.substring(offsetDistCounter * 2, offsetDistCounter *2 + 2), 16)/32 + 1;

  // console.log(distGain);
  preDistGain.gain.value = distGain;

  distCounter--;
  if(distCounter === -1) distCounter = hashesRaw.length - 1;

  offsetDistCounter++;
  offsetDistCounter %= HALF_HASH_LENGTH;

}, 500);


let delayCounter = hashesRaw.length - 1;
let offsetDelayCounter = 0;
setInterval(() => {
  const hash = hashesRaw[delayCounter];
  const delayTime = parseInt(hash.substring(offsetDistCounter * 2, offsetDistCounter *2 + 2), 16)/256 + 0.2;

  console.log(delayTime);
  delay.delayTime.value = delayTime;

  delayCounter--;
  if(delayCounter === -1) delayCounter = hashesRaw.length - 1;

  offsetDelayCounter++;
  offsetDelayCounter %= HALF_HASH_LENGTH;

}, 500);


const colors =["#fcba03","#17cbd1","#e30e2e","#18f52f","#ed6f0e","#1422e0","#ff99ff"."#ff99b3"]

const rand =  Math.floor(Math.random() * colors.length);

$('#fad').click(function(){
  $("#first").fadeIn("slow",function(){

  });
});
