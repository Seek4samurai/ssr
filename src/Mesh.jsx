import { useEffect, useRef } from "react";
import { loadCoords } from "./functions/loadcsv";

export default function Mesh() {
  const canvasRef = useRef(null);

  const transform = useRef({
    x: 0.0,
    y: 0.0,
    scale: 0.5,
    targetScale: 0.5,
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    let animationFrameId;

    // ---- SHADERS ----
    const vs = `
      attribute vec3 aData;
      uniform float uAspect;
      uniform vec2 uOffset;
      uniform float uScale;
      varying float vEnergy;

      void main() {
          vec2 pos = aData.xy;
          vEnergy = aData.z;

          // Spiral Logic
          float r = length(pos);
          float theta = atan(pos.y, pos.x);
          theta += r * 20.0;
          theta += sin(r * 20.0) * 0.5;
          r += sin(r * 15.0) * 0.05;
          r += (fract(sin(dot(pos.xy, vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 0.05;

          pos.x = r * cos(theta);
          pos.y = r * sin(theta);

          // Apply Pan and Zoom
          vec2 transformedPos = (pos + uOffset) * uScale;

          // Adjust for aspect ratio
          transformedPos.x /= uAspect;

          float scale = 8.0;
          gl_Position = vec4(transformedPos * scale, 0.0, 1.0);
          
          // FIXED: Use built-in max() and ensure float types (1.0)
          gl_PointSize = max(1.0, 2.0 * uScale); 
      }
    `;

    const fs = `
      precision mediump float;
      varying float vEnergy;

      void main() {
          float h = vEnergy;
          float s = 1.0;
          float l = 0.5;
          float c = (1.0 - abs(2.0 * l - 1.0)) * s;
          float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
          float m = l - c / 2.0;
          vec3 rgb;

          if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
          else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
          else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
          else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
          else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
          else rgb = vec3(c, 0.0, x);

          gl_FragColor = vec4(rgb + m, 1.0);
      }
    `;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader Error:", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const aspectLoc = gl.getUniformLocation(program, "uAspect");
    const offsetLoc = gl.getUniformLocation(program, "uOffset");
    const scaleLoc = gl.getUniformLocation(program, "uScale");
    const dataLoc = gl.getAttribLocation(program, "aData");

    // --- INTERACTION EVENTS ---
    const handleWheel = (e) => {
      e.preventDefault();
      // const zoomSpeed = 0.1;
      const zoomSpeed = 0.005; // smaller = smoother
      transform.current.targetScale *= Math.exp(-e.deltaY * zoomSpeed);
      transform.current.targetScale = Math.min(
        50,
        Math.max(0.25, transform.current.targetScale)
      );
    };

    const handleMouseDown = (e) => {
      transform.current.isDragging = true;
      transform.current.lastMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!transform.current.isDragging) return;

      const dx = e.clientX - transform.current.lastMouse.x;
      const dy = e.clientY - transform.current.lastMouse.y;

      // Adjust pan sensitivity based on scale
      transform.current.x +=
        ((dx / canvas.clientWidth) * 1.0) / transform.current.scale;
      transform.current.y -=
        ((dy / canvas.clientHeight) * 1.0) / transform.current.scale;

      transform.current.lastMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      transform.current.isDragging = false;
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const run = async () => {
      const coordsRaw = await loadCoords();
      const numPointsToUse = 500000;

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, coordsRaw, gl.STATIC_DRAW);

      gl.enableVertexAttribArray(dataLoc);
      gl.vertexAttribPointer(dataLoc, 3, gl.FLOAT, false, 0, 0);

      const render = () => {
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== canvas.clientWidth * dpr) {
          canvas.width = canvas.clientWidth * dpr;
          canvas.height = canvas.clientHeight * dpr;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // smooth zoom
        const t = transform.current;
        t.scale += (t.targetScale - t.scale) * 0.05;

        gl.useProgram(program);

        // Now these locations are guaranteed to be from the "associated program"
        gl.uniform1f(aspectLoc, canvas.width / canvas.height);
        gl.uniform2f(offsetLoc, transform.current.x, transform.current.y);
        gl.uniform1f(scaleLoc, transform.current.scale);

        gl.drawArrays(gl.POINTS, 0, numPointsToUse);
        animationFrameId = requestAnimationFrame(render);
      };

      render();
    };

    run();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center bg-gray-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="rounded-2xl cursor-move touch-none"
        style={{ width: "95vw", height: "95vh" }}
      />
    </div>
  );
}

