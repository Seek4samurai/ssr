import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { loadCoords } from "./functions/loadcsv";

export default function Mesh() {
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    const initPixi = async () => {
      const app = new PIXI.Application();

      await app.init({
        resizeTo: containerRef.current,
        backgroundColor: 0x6b727f,
        resolution: window.devicePixelRatio || 1,
        antialias: false, // Turn off for better performance with 0M points
      });

      appRef.current = app;
      containerRef.current.appendChild(app.canvas);

      const coords = await loadCoords();

      const dot = new PIXI.Graphics().circle(1, 1, 1).fill(0x60a5f9);

      const texture = app.renderer.generateTexture(dot);

      const w = app.screen.width;
      const h = app.screen.height;

      for (let i = 0; i < 10000; i += 2) {
        const s = new PIXI.Sprite(texture);
        s.x = (coords[i] + 1) * 0.5 * w;
        s.y = (coords[i + 1] + 1) * 0.5 * h;
        app.stage.addChild(s);
      }
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden bg-gray-501"
      style={{ height: "99vh", width: "100vw" }}
    />
  );
}

