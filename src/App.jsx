// Senior Weather App – all components in one file
// Tech: React + Tailwind CSS v4 + Recharts + Open-Meteo APIs (no key required)
// Install deps: npm i recharts

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,   // <-- ADD THIS
} from 'recharts'



/*************************************
 * 1) THEME & GLOBAL VARS (Tailwind)
 *************************************/
// In your global.css, add:
//
// :root {
//   --primary-color: #4a6fa5;
//   --secondary-color: #6b98d1;
//   --accent-color: #ffcc00;
//   --background-color: #e0e5f8;
//   --card-bg: rgba(255, 255, 255, 0.15);
//   --text-color: #1e1e2f;
//   --text-light: #555;
//   --border-radius: 16px;
//   --shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
//   --transition: all 0.3s ease;
// }
// .dark {
//   --primary-color: #3a5a86;
//   --secondary-color: #517eb3;
//   --accent-color: #ffd84d;
//   --background-color: #0f172a;
//   --card-bg: rgba(2, 6, 23, 0.55);
//   --text-color: #e5e7eb;
//   --text-light: #9ca3af;
// }

/*************************************
 * 2) UTILITIES
 *************************************/
const toF = (c) => (c * 9) / 5 + 32
const toC = (f) => ((f - 32) * 5) / 9
const msToKmh = (ms) => ms * 3.6
const msToMph = (ms) => ms * 2.23694
const mmToIn = (mm) => mm / 25.4

const fmtTemp = (v, unit) => (unit === 'imperial' ? Math.round(toF(v)) : Math.round(v))
const fmtWind = (ms, speedUnit) => {
  if (speedUnit === 'kmh') return `${Math.round(msToKmh(ms))} km/h`
  if (speedUnit === 'mph') return `${Math.round(msToMph(ms))} mph`
  return `${Math.round(ms)} m/s`
}
const fmtPrecip = (mm, unit) => (unit === 'imperial' ? `${mmToIn(mm).toFixed(2)} in` : `${mm.toFixed(1)} cc`)

/*************************************
 * 3) API HELPERS (Open-Meteo)
 *************************************/
async function geocode(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=5&language=en&format=json`
  const r = await fetch(url)
  if (!r.ok) throw new Error('Geocoding failed')
  const json = await r.json()
  return (
    json.results?.map((x) => ({
      id: `${x.latitude},${x.longitude}`,
      name: `${x.name}${x.country ? ', ' + x.country : ''}`,
      lat: x.latitude,
      lon: x.longitude,
    })) || []
  )
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
    hourly: 'temperature_2m,precipitation,rain,snowfall',
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max,weathercode',
    timezone: 'auto',
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const r = await fetch(url)
  if (!r.ok) throw new Error('Forecast failed')
  return r.json()
}

const WCODE = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Slight rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
}
const WICONS = {
  0: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-day-sunny.svg",
  1: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-day-sunny-overcast.svg",
  2: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-day-cloudy.svg",
  3: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-cloudy.svg",
  45: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-fog.svg",
  48: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-fog.svg",
  51: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-sprinkle.svg",
  53: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-sprinkle.svg",
  55: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-rain.svg",
  61: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-rain.svg",
  63: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-rain.svg",
  65: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-rain-wind.svg",
  71: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-snow.svg",
  73: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-snow.svg",
  75: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-snow-wind.svg",
  80: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-showers.svg",
  81: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-showers.svg",
  82: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-showers.svg",
  95: "https://raw.githubusercontent.com/erikflowers/weather-icons/master/svg/wi-thunderstorm.svg",
};

/*************************************
 * 4) HOOKS
 *************************************/
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const v = localStorage.getItem(key)
      return v ? JSON.parse(v) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(val))
  }, [key, val])

  return [val, setVal]
}

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/*************************************
 * 5) COMPONENTS
 *************************************/
export default function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')
  const [unit, setUnit] = useLocalStorage('tempUnit', 'metric')
  const [speedUnit, setSpeedUnit] = useLocalStorage('speedUnit', 'kmh')
  const [saved, setSaved] = useLocalStorage('savedCities', [
    { id: '51.5072,-0.1276', name: 'London, GB', lat: 51.5072, lon: -0.1276 },
  ])
  const [active, setActive] = useLocalStorage('activeCityId', saved[0]?.id || '')
  const activeCity = saved.find((c) => c.id === active) || saved[0]

  const [wx, setWx] = useState({})

  const refresh = useCallback(async () => {
    if (!activeCity) return
    const data = await fetchWeather(activeCity.lat, activeCity.lon)
    setWx((prev) => ({ ...prev, [activeCity.id]: data }))
  }, [activeCity])

  useEffect(() => {
    refresh(); // initial fetch
    const id = setInterval(refresh, 3 * 60 * 1000); // 3 minutes
    return () => clearInterval(id);
  }, [refresh]);
  

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const data = wx[activeCity?.id]

  return (
    <div className="min-h-screen w-full bg-[var(--background-color)] text-[var(--text-color)] transition-colors">
      {/* Desktop */}
      <div className="hidden lg:flex flex-col gap-4 p-4 max-w-[1400px] mx-auto">
        
        <SearchWithSuggestions
          onAdd={(loc) => {
            if (!saved.some((s) => s.id === loc.id)) {
              const next = [...saved, loc]
              setSaved(next)
              setActive(loc.id)
            } else setActive(loc.id)
          }}
        />
        <div className="flex gap-4">
          <div className='flex flex-col justify-between gap-4'>
            <Card className="w-[350px] flex items-center justify-center h-full">
              <StatsPanel data={data} unit={unit} speedUnit={speedUnit} city={activeCity} />
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Card><MiniMetric label="Humidity" value={data?.current?.relative_humidity_2m ? `${data.current.relative_humidity_2m}%` : '—'} /></Card>
              <Card><MiniMetric label="Wind" value={data?.current?.wind_speed_10m ? fmtWind(data.current.wind_speed_10m / 3.6, speedUnit) : '—'} /></Card>
            </div>
          </div>
          <Card className="flex-grow">
            <WeatherChart data={data} unit={unit} />
          </Card>
        </div>

        <Card><Forecast7Days data={data} unit={unit} /></Card>

        <div className="flex gap-4">
          <Card className="flex-grow">
            <SavedLocations
              saved={saved}
              activeId={active}
              onActivate={setActive}
              onRemove={(id) => {
                const next = saved.filter((s) => s.id !== id)
                setSaved(next)
                if (active === id && next.length) setActive(next[0].id)
              }}
              onClear={() => {
                setSaved([])
                setActive('')
              }}
            />
          </Card>
          <Card className="flex-grow">
            <SettingsPanel
              theme={theme}
              setTheme={setTheme}
              unit={unit}
              setUnit={setUnit}
              speedUnit={speedUnit}
              setSpeedUnit={setSpeedUnit}
            />
          </Card>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden p-3 space-y-3 max-w-xl mx-auto">

          <SearchWithSuggestions
            onAdd={(loc) => {
              if (!saved.some((s) => s.id === loc.id)) {
                const next = [...saved, loc]
                setSaved(next)
                setActive(loc.id)
              } else setActive(loc.id)
            }}
          />


        <Card>
          <StatsPanel data={data} unit={unit} speedUnit={speedUnit} city={activeCity} />
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card><MiniMetric label="Humidity" value={data?.current?.relative_humidity_2m ? `${data.current.relative_humidity_2m}%` : '—'} /></Card>
          <Card><MiniMetric label="Wind" value={data?.current?.wind_speed_10m ? fmtWind(data.current.wind_speed_10m / 3.6, speedUnit) : '—'} /></Card>
        </div>

        <Card>
          <WeatherChart data={data} unit={unit} />
        </Card>

        <Card>
          <Forecast7Days data={data} unit={unit} compact />
        </Card>

        <Card>
          <SavedLocations
            saved={saved}
            activeId={active}
            onActivate={setActive}
            onRemove={(id) => setSaved(saved.filter((s) => s.id !== id))}
            onClear={() => {
              setSaved([])
              setActive('')
            }}
          />
        </Card>

        <Card>
          <SettingsPanel
            theme={theme}
            setTheme={setTheme}
            unit={unit}
            setUnit={setUnit}
            speedUnit={speedUnit}
            setSpeedUnit={setSpeedUnit}
          />
        </Card>
      </div>
    </div>
  )
}

/*************************************
 * Small Primitives
 *************************************/
function Card({ className = '', children }) {
  return (
    <div className={`rounded-[var(--border-radius)] bg-[var(--card-bg)] shadow-[var(--shadow)] backdrop-blur-md p-4 ${className}`}>
      {children}
    </div>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-sm text-[var(--text-light)]">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

/*************************************
 * SearchWithSuggestions – geocoding + add
 *************************************/
function SearchWithSuggestions({ onAdd, compact = false }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQ = useDebounce(q, 300);

  useEffect(() => {
    let live = true;
    async function fetchList() {
      if (!debouncedQ || debouncedQ.length < 2) {
        setList([]);
        return;
      }
      try {
        setLoading(true);
        const items = await geocode(debouncedQ);
        if (live) setList(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
    return () => (live = false);
  }, [debouncedQ]);

  return (
    <div className="relative w-full">
      <div className={`flex ${compact ? '' : 'gap-2'} relative`}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city..."
          className="w-full flex-grow rounded-md px-3 py-2 outline-none border border-white/20 bg-white text-black placeholder-[var(--text-light)]"
        />
        {!compact && (
          <button
            onClick={() => q && list[0] && onAdd(list[0])}
            className="px-3 py-2 rounded-md bg-[var(--primary-color)] text-white hover:opacity-90"
          >
            Add
          </button>
        )}
      </div>

      {list.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-white text-black shadow-lg z-[9999]">
          {list.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onAdd(item)
                setQ('')
                setList([])
              }}
              className="w-full text-left px-3 py-2 hover:bg-[var(--secondary-color)]/20"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-2 top-2 text-sm text-[var(--text-light)] z-50">
          Loading…
        </div>
      )}
    </div>
  )
}

/*************************************
 * SavedLocations – list/add/remove/clear
 *************************************/
function SavedLocations({ saved, activeId, onActivate, onRemove, onClear }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Saved Locations</h2>
        <div className="flex gap-2">
          <button onClick={onClear} className="px-3 py-1 rounded-md bg-red-500 text-white">
            Clear All
          </button>
        </div>
      </div>
      {saved.length === 0 ? (
        <p className="text-[var(--text-light)]">No saved locations yet. Use search to add.</p>
      ) : (
        <ul className="grid md:grid-cols-2 gap-2">
          {saved.map((c) => (
            <li
              key={c.id}
              className={`flex items-center justify-between rounded-md px-3 py-2 border ${activeId === c.id ? 'border-[var(--primary-color)]' : 'border-white/20'}`}
            >
              <button onClick={() => onActivate(c.id)} className="text-left flex-1">{c.name}</button>
              <button onClick={() => onRemove(c.id)} className="text-red-600 ml-3">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/*************************************
 * StatsPanel
 *************************************/
function StatsPanel({ data, unit, speedUnit, city }) {
  const cur = data?.current
  const daily = data?.daily
  const temp = cur?.temperature_2m
  const wdesc = daily ? WCODE[daily.weathercode?.[0]] || '—' : '—'
  const code = daily?.weathercode?.[0];
  const icon = WICONS[code];
  return (
    <div className="h-full w-full grid grid-rows-[auto_1fr]">
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <h1 className="font-semibold text-xl">{city?.name || "Choose City"}</h1>
        <p className="text-sm text-[var(--text-light)]">{new Date().toLocaleDateString()}</p>
        {icon && <img src={icon} alt={wdesc} className="w-20 h-20 md:w-28 md:h-28 text-[var(--text-light)]" />}
        <div className="text-5xl font-bold">{typeof temp === 'number' ? `${fmtTemp(temp, unit)}°${unit === 'metric' ? 'C' : 'F'}` : '—'}</div>
        <div className="text-md font-medium">{wdesc}</div>
      </div>
    </div>
  )
}

/*************************************
 * Forecast7Days
 *************************************/
function Forecast7Days({ data, unit, compact = false }) {
  const daily = data?.daily;
  if (!daily) return <div className="text-[var(--text-light)]">No forecast.</div>;

  const rows = daily.time.map((t, i) => ({
    time: t,
    tmin: daily.temperature_2m_min?.[i],
    tmax: daily.temperature_2m_max?.[i],
    rain: daily.rain_sum?.[i] ?? 0,
    snow: daily.snowfall_sum?.[i] ?? 0,
    code: daily.weathercode?.[i],
  }));

  return (
    <div className="h-full w-full flex flex-col flex-grow">
      <h3 className="font-semibold mb-2">7 day forecast</h3>
      <div className="flex gap-2 overflow-x-auto">
        {rows.slice(0, 7).map((d) => {
          const icon = WICONS[d.code];
          const desc = WCODE[d.code] || '';
          return (
            <div key={d.time} className="min-w-30 flex flex-col items-center justify-center rounded-xl bg-[var(--card-bg)] border border-white/20 p-2 min-xl:w-full">
              <div className="text-xs text-[var(--text-light)]">{new Date(d.time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              {icon && <img src={icon} alt={desc} className="w-12 h-12 md:w-16 md:h-16 my-1" />}
              <div className="text-xs font-medium">{desc}</div>
              <div className="text-sm font-semibold">{fmtTemp(d.tmax, unit)}° / {fmtTemp(d.tmin, unit)}°</div>
              <div className="text-xs">Rain: {fmtPrecip(d.rain, unit)}{d.snow ? ` | Snow: ${fmtPrecip(d.snow, unit)}` : ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


/*************************************
 * WeatherChart
 *************************************/
function WeatherChart({ data, unit }) {
  const hourly = data?.hourly;
  const unitSymbol = unit === 'metric' ? 'C' : 'F';
  const [range, setRange] = React.useState('3h');
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update current time every 1 hour
  React.useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000*60*60);
    return () => clearInterval(interval);
  }, []);

// Generate chart points from actual API data
  const rows = React.useMemo(() => {
    if (!hourly) return [];

    let points = 30; // default
    switch (range) {
      case '3h':
        points = 3;
        break;
      case '1d':
        points = 24;
        break;
      case '1w':
        points = 7 * 24;
        break;
      default:
        points = 24;
    }

    // === find index of current hour in API ===
    const now = new Date();
    const currentIdx = hourly.time.findIndex(
      (t) => new Date(t).getHours() === now.getHours()
    );

    const startIdx = currentIdx >= 0 ? currentIdx : 0;

    return Array.from({ length: points }, (_, i) => {
      const idx = startIdx + i;
      return {
        time: hourly.time[idx],
        temp: hourly.temperature_2m[idx],
        precip: hourly.precipitation[idx],
      };
    }).filter((r) => r.time && r.temp !== undefined);
  }, [hourly, range]);



  if (!rows.length) return <div>No data available</div>;

  // Dynamic temperature wave
  const temps = rows.map(r => r.temp).filter(v => v != null);
  const minTemp = Math.min(...temps) - 1;
  const maxTemp = Math.max(...temps) + 1;

  // Nearest time for reference line
  const nearestTime = rows.reduce((prev, curr) =>
    Math.abs(new Date(curr.time) - currentTime) <
      Math.abs(new Date(prev.time) - currentTime)
      ? curr
      : prev
  ).time;

  return (
    <div className="h-[300px] w-full">
      <div className="flex justify-between mb-2">
        <h3 className="font-semibold text-lg">Weather Chart</h3>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="border rounded p-1 text-sm"
        >
          <option value="3h">3 Hours</option>
          <option value="1d">1 Day</option>
          <option value="1w">1 Week</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--text-light)" />

          <XAxis
            dataKey="time"
            tickFormatter={(t) => {
              const dt = new Date(t);
              if (range === '1w') return dt.toLocaleDateString(undefined, { weekday: 'short' });
              if (range === '1d') return dt.getHours() + ':00';
              return dt.getHours() + ':00'; // hourly granularity, clean labels
            }}
            stroke="var(--text-color)"
          />


          <YAxis
            yAxisId="left"
            stroke="var(--text-color)"
            domain={[minTemp, maxTemp]} // dynamic wave
          />
          <YAxis yAxisId="right" orientation="right" stroke="var(--text-color)" />

          <Tooltip
            labelFormatter={(t) => new Date(t).toLocaleString()}
            formatter={(val, name) => {
              if (name === 'temp') return `${val.toFixed(1)}°${unitSymbol}`;
              if (name === 'precip') return `${val} mm`;
              return val;
            }}
          />

          <Legend />

          <Bar yAxisId="right" dataKey="precip" name="precip" fill="var(--primary-color)" barSize={8} />

          <Line yAxisId="left" type="monotone" dataKey="temp" name="temp" stroke="var(--accent-color)" dot={false} />

          <ReferenceLine x={nearestTime} stroke="red" strokeWidth={2} label="Now" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


/*************************************
 * SettingsPanel
 *************************************/
function SettingsPanel({ theme, setTheme, unit, setUnit, speedUnit, setSpeedUnit }) {
  const btnClass = (active) => `px-3 py-1 rounded-md border ${active ? 'bg-[var(--accent-color)] text-black' : 'border-white/30'}`

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-sm text-[var(--text-light)]">Theme</div>
          <div className="flex gap-2">
            <button className={btnClass(theme === 'light')} onClick={() => setTheme('light')}>Light</button>
            <button className={btnClass(theme === 'dark')} onClick={() => setTheme('dark')}>Dark</button>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-[var(--text-light)]">Temperature</div>
          <div className="flex gap-2">
            <button className={btnClass(unit === 'metric')} onClick={() => setUnit('metric')}>°C</button>
            <button className={btnClass(unit === 'imperial')} onClick={() => setUnit('imperial')}>°F</button>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-[var(--text-light)]">Wind speed</div>
          <div className="flex gap-2 flex-wrap">
            <button className={btnClass(speedUnit === 'kmh')} onClick={() => setSpeedUnit('kmh')}>km/h</button>
            <button className={btnClass(speedUnit === 'mph')} onClick={() => setSpeedUnit('mph')}>mph</button>
            <button className={btnClass(speedUnit === 'ms')} onClick={() => setSpeedUnit('ms')}>m/s</button>
          </div>
        </div>
      </div>
    </div>
  )
}
