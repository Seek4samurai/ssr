import { useEffect, useRef } from "react";
import { loadCoords } from "./functions/loadcsv";

export default function Mesh() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      const canvas = canvasRef.current;
      const gl = canvas.getContext("webgl");

      // Resize
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);

      const coords = await loadCoords(); // Float32Array [-1..1]

      // ---- SHADERS ----
      const vs = `
        attribute vec2 aPos;
        uniform float uTime;

        void main() {
          vec2 pos = aPos;

          // subtle wave animation
          pos.y += sin(uTime + aPos.x * 10.0) * 0.02;
          pos.x += cos(uTime + aPos.y * 10.0) * 0.02;

          gl_Position = vec4(pos, 0.0, 1.0);
          gl_PointSize = 2.0;
        }
      `;

      const fs = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(0.38, 0.65, 0.98, 1.0);
        }
      `;

      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };

      const program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(program);
      gl.useProgram(program);

      const timeLoc = gl.getUniformLocation(program, "uTime");

      // ---- BUFFER ----
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STATIC_DRAW);

      const loc = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      // ---- DRAW ----
      gl.clearColor(0.42, 0.45, 0.5, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, coords.length / 2);

      let start = performance.now();

      const draw = () => {
        const t = (performance.now() - start) * 0.001; // seconds

        gl.clearColor(0.42, 0.45, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform1f(timeLoc, t);
        gl.drawArrays(gl.POINTS, 0, coords.length / 2);

        requestAnimationFrame(draw);
      };

      draw();
    };

    run();
  }, []);

  return (
    <center className="w-full h-full flex justify-center items-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl"
        style={{ width: "95vw", height: "90vh" }}
      />
    </center>
  );
}

