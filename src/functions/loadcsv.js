export async function loadSongsCSV(url) {
  const res = await fetch(url);
  const text = await res.text();

  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};

    headers.forEach((h, i) => {
      const v = values[i];
      row[h] =
        v === "False" ? false : v === "True" ? true : isNaN(v) ? v : Number(v);
    });

    return row;
  });
}

export function mapSongsToPoints(songs) {
  return songs.map((song) => ({
    id: song.id,
    name: song.name,

    // normalize to [-1, 1]
    x: song.danceability * 2 - 1,
    y: song.energy * 2 - 1,

    energy: song.energy,
    danceability: song.danceability,
    year: song.year,
  }));
}

// export async function loadCoords() {
//   const res = await fetch("http://localhost:8000/songs/coords");
//   const buffer = await res.arrayBuffer();
//   return new Float32Array(buffer); // 2 floats per song
// }

export async function loadCoords() {
  const res = await fetch("http://localhost:8000/songs/coords?t=" + Date.now());
  const buffer = await res.arrayBuffer();
  const data = new Float32Array(buffer);
  return data;
}
