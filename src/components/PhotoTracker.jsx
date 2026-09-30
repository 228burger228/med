import React, { useRef, useState } from "react";
import { Camera, Trash2, Lock } from "lucide-react";
import { C } from "../theme/tokens";
import { formatDay, dateKey } from "../utils/stats";

/** Уменьшаем фото до ~640px JPEG, чтобы пары снимков помещались в localStorage. */
function downscale(file, max = 640) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

function Slot({ label, value, onPick }) {
  return (
    <button
      onClick={onPick}
      style={{
        flex: 1,
        height: 110,
        borderRadius: 12,
        border: `1.5px dashed ${value ? "transparent" : C.tealBorder}`,
        background: C.tealSoft,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        overflow: "hidden",
        position: "relative",
        padding: 0,
        color: C.teal,
      }}
    >
      {value ? (
        <>
          <img src={value} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <span style={{ position: "absolute", bottom: 6, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
            {label}
          </span>
        </>
      ) : (
        <>
          <Camera size={20} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        </>
      )}
    </button>
  );
}

export function PhotoTracker({ photos, onSave, onDelete }) {
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [error, setError] = useState("");
  const beforeRef = useRef(null);
  const afterRef = useRef(null);

  const handleFile = (setter) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setter(await downscale(file));
      setError("");
    } catch {
      setError("Не удалось открыть изображение.");
    }
  };

  const save = () => {
    const ok = onSave({ id: Date.now(), date: dateKey(), before, after });
    if (ok === false) {
      setError("Не хватает места в хранилище браузера. Удалите старые сравнения.");
      return;
    }
    setBefore(null);
    setAfter(null);
  };

  return (
    <div className="card">
      <input ref={beforeRef} type="file" accept="image/*" onChange={handleFile(setBefore)} hidden />
      <input ref={afterRef} type="file" accept="image/*" onChange={handleFile(setAfter)} hidden />
      <div className="row">
        <Slot label="До" value={before} onPick={() => beforeRef.current?.click()} />
        <Slot label="После" value={after} onPick={() => afterRef.current?.click()} />
      </div>
      <div className="small row" style={{ gap: 6, marginTop: 8 }}>
        <Lock size={12} /> Фото хранятся только в этом браузере.
      </div>
      {error && <div className="small" style={{ color: C.red, marginTop: 6 }}>{error}</div>}
      <button className="btn btn-primary block sm" style={{ marginTop: 10 }} onClick={save} disabled={!before || !after}>
        Сохранить сравнение
      </button>
      {photos.map((c) => (
        <div key={c.id} style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
          <div className="row" style={{ gap: 6 }}>
            <img src={c.before} alt="До" style={{ flex: 1, minWidth: 0, height: 110, objectFit: "cover", borderRadius: 10 }} />
            <img src={c.after} alt="После" style={{ flex: 1, minWidth: 0, height: 110, objectFit: "cover", borderRadius: 10 }} />
          </div>
          <div className="between" style={{ marginTop: 4 }}>
            <span className="small">Сравнение от {formatDay(c.date, { day: "numeric", month: "long", year: "numeric" })}</span>
            <button className="icon-btn" onClick={() => onDelete(c.id)} aria-label="Удалить сравнение">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
