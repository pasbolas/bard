// Aurora WebGL Background Animation
const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  vec3 color1 = uColorStops[0];
  vec3 color2 = uColorStops[1];
  vec3 color3 = uColorStops[2];
  
  vec3 rampColor = mix(color1, color2, uv.x);
  rampColor = mix(rampColor, color3, uv.x);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [0, 0, 0];
}

function initAurora(container, options = {}) {
  const {
    colorStops = ['#5227FF', '#7cff67', '#5227FF'],
    amplitude = 1.0,
    blend = 0.5,
    speed = 1.0
  } = options;

  if (!container) {
    console.error('Aurora: No container provided');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) {
    console.error('WebGL 2 not supported');
    return;
  }

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // Create shader program
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, VERT);
  gl.compileShader(vertShader);

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, FRAG);
  gl.compileShader(fragShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  // Create fullscreen triangle
  const vertices = new Float32Array([
    -1, -1,
    3, -1,
    -1, 3
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Get uniform locations
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uAmplitude = gl.getUniformLocation(program, 'uAmplitude');
  const uColorStops = gl.getUniformLocation(program, 'uColorStops');
  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uBlend = gl.getUniformLocation(program, 'uBlend');

  // Set initial color stops
  const colorStopsArray = colorStops.map(hex => hexToRgb(hex)).flat();
  gl.uniform3fv(uColorStops, new Float32Array(colorStopsArray));

  let animationId;
  let startTime = Date.now();

  const resize = () => {
    const width = container.offsetWidth || window.innerWidth;
    const height = container.offsetHeight || window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uResolution, width, height);
  };

  const animate = () => {
    const elapsed = (Date.now() - startTime) * 0.001;
    gl.uniform1f(uTime, elapsed * speed * 0.1);
    gl.uniform1f(uAmplitude, amplitude);
    gl.uniform1f(uBlend, blend);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    animationId = requestAnimationFrame(animate);
  };

  window.addEventListener('resize', resize);
  resize();
  animate();

  return () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
    if (canvas.parentNode === container) {
      container.removeChild(canvas);
    }
  };
}

// Auto-initialize if element exists
document.addEventListener('DOMContentLoaded', () => {
  const auroraContainer = document.getElementById('aurora-background');
  if (auroraContainer) {
    initAurora(auroraContainer, {
      colorStops: ['#5227FF', '#7cff67', '#5227FF'],
      amplitude: 0.8,
      blend: 0.5,
      speed: 1.0
    });
  }
});
