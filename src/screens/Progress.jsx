import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Moon, Utensils, Heart, Droplets, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { C, FONT } from "../theme/tokens";
import { RECOVERY_CARE_CHECKLIST } from "../data/mockData";
import { sanitizeText, detectRedFlagsInText } from "../utils/security";
import { dateKey, daysBetween, formatDay, painTrend } from "../utils/stats";
import { Card, ScreenTitle, RedFlagAlert } from "../components/ui/SharedUI";
import { PhotoTracker } from "../components/PhotoTracker";

const CARE_ICON = { "Сон": Moon, "Питание": Utensils, "Гидратация": Droplets };

export function ProgressScreen({ profile, painLog, sessions, diary, onAddDiary, onDeleteDiary, streak, bestStreak, adherence, photos, onSavePhoto, onDeletePhoto, onShowSos }) {
  const [entry, setEntry] = useState("");
  const [lastFlag, setLastFlag] = useState(null);

  const chartData = [...painLog]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((p) => ({ day: formatDay(p.date, { day: "numeric", month: "numeric" }), pain: p.pain }));
  const trend = painTrend(painLog);
  const daysIn = daysBetween(profile.startDate || dateKey(), dateKey()) + 1;

  const badges = [
    { icon: "🎯", label: "Первая тренировка", earned: sessions.length >= 1 },
    { icon: "🔥", label: "3 дня подряд", earned: bestStreak >= 3 },
    { icon: "🏅", label: "7 дней подряд", earned: bestStreak >= 7 },
    { icon: "💪", label: "10 тренировок", earned: sessions.length >= 10 },
    { icon: "📉", label: "Боль ↓ на 2 балла", earned: !!trend && trend.count > 1 && trend.first - trend.last >= 2 },
    { icon: "🗓", label: "Месяц с Ainala", earned: daysIn >= 30 },
  ];

  const addEntry = () => {
    const text = sanitizeText(entry, 500);
    if (!text) return;
    const flag = detectRedFlagsInText(text);
    onAddDiary({ id: Date.now(), date: dateKey(), text, redFlag: flag ? flag.title : null });
    setLastFlag(flag);
    setEntry("");
  };

  return (
    <div className="screen">
      <ScreenTitle>Прогресс</ScreenTitle>

      <div className="grid-2" style={{ marginBottom: 10 }}>
        <div className="stat">
          <div className="stat-value" style={{ color: C.teal }}>{adherence}%</div>
          <div className="stat-label">Выполнение плана, 7 дней</div>
        </div>
        <div className="stat">
          <div className="stat-value" style={{ color: C.coral }}>{streak}</div>
          <div className="stat-label">Дней подряд 🔥</div>
        </div>
        <div className="stat">
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-label">Тренировок всего</div>
        </div>
        <div className="stat">
          <div className="stat-value row" style={{ gap: 6 }}>
            {trend ? (
              <>
                {trend.first}→{trend.last}
                {trend.last < trend.first ? <TrendingDown size={20} color={C.green} /> : trend.last > trend.first ? <TrendingUp size={20} color={C.red} /> : null}
              </>
            ) : (
              "—"
            )}
          </div>
          <div className="stat-label">Боль: первая → последняя</div>
        </div>
      </div>

      <h2 className="h2">Динамика боли</h2>
      <Card style={{ padding: chartData.length > 1 ? "14px 8px 6px" : 16 }}>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={chartData} margin={{ top: 6, right: 10, bottom: 0, left: -6 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis domain={[0, 10]} ticks={[0, 3, 6, 10]} tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 10, border: `1px solid ${C.line}` }} formatter={(v) => [`${v}/10`, "Боль"]} />
              <Line type="monotone" dataKey="pain" stroke={C.coral} strokeWidth={2.5} dot={{ r: 3.5, fill: C.coral }} name="Боль" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty">
            📈 График появится, когда вы отметите боль хотя бы два дня.
            <br />
            Отметка — на главном экране.
          </div>
        )}
      </Card>

      <h2 className="h2">Дневник симптомов</h2>
      <Card>
        <textarea
          className="input"
          rows={3}
          value={entry}
          maxLength={500}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Как вы себя чувствовали? Отёк, скованность, сон, настроение…"
        />
        <button className="btn btn-primary block sm" style={{ marginTop: 8 }} onClick={addEntry} disabled={!entry.trim()}>
          Добавить запись
        </button>
        {lastFlag && (
          <div style={{ marginTop: 10 }}>
            <RedFlagAlert flag={lastFlag} onShowSos={onShowSos} />
          </div>
        )}
        {diary.slice(0, 10).map((e) => (
          <div key={e.id} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
            <div className="between">
              <span className="small">{formatDay(e.date, { day: "numeric", month: "long" })}</span>
              <button className="icon-btn" onClick={() => onDeleteDiary(e.id)} aria-label="Удалить запись">
                <Trash2 size={14} />
              </button>
            </div>
            {e.redFlag && <div style={{ fontSize: 11.5, fontWeight: 700, color: C.red, marginBottom: 2 }}>⚠ {e.redFlag}</div>}
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{e.text}</div>
          </div>
        ))}
      </Card>

      <h2 className="h2">Достижения</h2>
      <div className="grid-2" style={{ marginBottom: 10 }}>
        {badges.map((b) => (
          <div key={b.label} className="stat" style={{ textAlign: "center", opacity: b.earned ? 1 : 0.5, background: b.earned ? C.tealSoft : C.paper, borderColor: b.earned ? C.tealBorder : C.line, filter: b.earned ? "none" : "grayscale(1)" }}>
            <div style={{ fontSize: 24 }}>{b.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{b.label}</div>
          </div>
        ))}
      </div>

      <h2 className="h2">Опоры восстановления</h2>
      {RECOVERY_CARE_CHECKLIST.map((item) => {
        const Icon = CARE_ICON[item.category] || Heart;
        return (
          <Card key={item.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div className="icon-tile" style={{ background: item.category === "Сон" ? C.skySoft : C.tealSoft }}>
              <Icon size={18} color={item.category === "Сон" ? C.sky : C.teal} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.title}</div>
              <div className="small" style={{ marginTop: 3 }}>{item.subtitle}</div>
            </div>
          </Card>
        );
      })}

      <h2 className="h2">Фото «до / после»</h2>
      <PhotoTracker photos={photos} onSave={onSavePhoto} onDelete={onDeletePhoto} />
    </div>
  );
}
