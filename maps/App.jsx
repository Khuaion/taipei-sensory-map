import { useState, useEffect } from "react";
import "./App.css";

const layers = [
  {
    id: "sensory",
    en: "Multisensory Urban Sensory Index",
    zh: "多感官感受度綜合指數",
    image: `${import.meta.env.BASE_URL}maps/sensory.png`,
    color: "#1a6b8a",
    tag: "Composite",
    method: "將聲景、氣味、視覺綠意與 PM2.5 四個圖層標準化至 0–1，以聲景 35%、氣味 25%、植被 25%、PM2.5 15% 加權疊合，採用 Raster Calculator 運算。",
    limitation: "本指數為 proxy-based composite index，非居民主觀問卷或實測感受資料；權重設定具研究判斷性，各圖層代理指標精度不一致。",
    finding: "感官庇護集中於陽明山、南港山系與文山山區；感官負擔沿主要幹道、快速道路形成路網骨架式分布。",
  },
  {
    id: "edu",
    en: "Socioeconomic Status × Sensory Index",
    zh: "高學歷感官特權圖層",
    image: `${import.meta.env.BASE_URL}maps/Edu.png`,
    color: "#e67e22",
    tag: "Equity",
    method: "以高學歷人口比例（博碩大學）作為社經地位代理，透過 Zonal Statistics 計算各二級發布區平均感受度，以雙變數顏色（Bivariate Colors）呈現 3×3 矩陣。",
    limitation: "高學歷比例無法完整代表收入、房價與職業；結果為區域尺度分析，不能直接推論至個人層次。",
    finding: "高學歷、高感受度區塊集中於士林天母、大安南側與內湖科學園區周邊，陽明山山麓呈現最顯著的感官特權空間聚集。",
  },
  {
    id: "age",
    en: "Age Vulnerability × Sensory Deprivation",
    zh: "高齡感官剝奪圖層",
    image: `${import.meta.env.BASE_URL}maps/age.png`,
    color: "#2980b9",
    tag: "Equity",
    method: "以 65 歲以上人口比例作為高齡脆弱性代理，疊合各統計區平均感受度，以雙變數顏色呈現高齡化與感官負擔的空間重疊。",
    limitation: "高齡比例無法代表實際健康狀況與行動能力；資料以居住地為基準，無法反映日常移動時的感官暴露差異。",
    finding: "部分高齡社區分布於萬華、大同等老市區，與較高感官負擔空間重疊，初步支持感官環境剝奪的環境正義假說。",
  },
  {
    id: "sound",
    en: "Soundscape Noise Burden Proxy",
    zh: "聲景噪音負擔代理圖層",
    image: `${import.meta.env.BASE_URL}maps/sound.png`,
    color: "#c0392b",
    tag: "Soundscape",
    method: "以 OpenStreetMap 道路等級（motorway 300m → residential 15m）與捷運路線（200m buffer）作為噪音代理，Feature to Raster 後取最大值合併，Min-Max 標準化。",
    limitation: "非實測分貝資料；未納入即時交通量、尖離峰差異、建築隔音效果；捷運地下段未區分處理。",
    finding: "環河快速道路與忠孝東西路等主幹道形成最高噪音負擔帶；陽明山與南港山系構成最主要聲景庇護腹地。",
  },
  {
    id: "smell",
    en: "Smellscape Quality Proxy",
    zh: "氣味景觀品質代理圖層",
    image: `${import.meta.env.BASE_URL}maps/smell.png`,
    color: "#29b7cb",
    tag: "Smellscape",
    method: "以 OSM POI 分五類，公園（KDE 150m）、咖啡廳（50m）、餐廳（80m）、市場（120m）、負向設施（200–300m），加權合併後 Min-Max 標準化至 0–1。",
    limitation: "無法反映實際氣味強度、營業時間與季節變化；部分自然林地（landuse=forest）未被納入計算，可能低估郊區正向植栽氣味。",
    finding: "整體呈中性背景，市中心因餐廳咖啡廳密集獲得較高正向得分；負向氣味設施分布相對分散，未形成顯著聚集區。",
  },
  {
    id: "ndvi",
    en: "NDVI / Vegetation Coverage Proxy",
    zh: "視覺綠意代理圖層",
    image: `${import.meta.env.BASE_URL}maps/NDVI.png`,
    color: "#2ecc71",
    tag: "Visual",
    method: "使用 Copernicus Sentinel-2 多光譜影像，計算 NDVI = (NIR - Red) / (NIR + Red)，再以 Min-Max 標準化。資料來源：dataspace.copernicus.eu。",
    limitation: "NDVI 為衛星俯視視角，無法代表行人實際看到的綠視率 GVI；水體 NDVI 為負值，可能低估水岸空間的正面視覺價值。",
    finding: "陽明山、南港山系與文山山區形成高植被覆蓋環帶；淡水河沿岸因河床裸地呈現低 NDVI 值；大安森林公園為市中心可辨識的綠色島嶼。",
  },
  {
    id: "pm25",
    en: "PM2.5 Seasonal Sensory Score",
    zh: "PM2.5 季節性感受分數",
    image: `${import.meta.env.BASE_URL}maps/AQI.png`,
    color: "#8e44ad",
    tag: "Air Quality",
    method: "使用環境部 1 月與 7 月 PM2.5 月均值，透過 IDW 插值建立連續面，分別重分類為三階感受分數（+1/0/-1），冬夏平均後轉換至 0–1。",
    limitation: "測站數量有限，IDW 插值在街道尺度精確度受限；夏季採相對基準（都會感官敏感標準），標準與冬季不一致。",
    finding: "冬夏平均後北側士林受東北季風影響呈較高污染；萬華西側出現高濃度核心；南側文山與東側內湖相對空氣品質較佳。",
  },
];

const tagColors = {
  Composite: "#1a6b8a",
  Soundscape: "#c0392b",
  Smellscape: "#29b7cb",
  Visual: "#2ecc71",
  "Air Quality": "#8e44ad",
  Equity: "#e67e22",
};

const rqItems = [
  {
    num: "01",
    q: "台北市的感官體驗是否存在空間不均等？",
    a: "是的。感官品質呈現明顯的核心—邊緣結構：山區與郊區感受度顯著高於市中心交通廊帶，且不同行政區之間存在可量化的感官落差。",
  },
  {
    num: "02",
    q: "哪些地方是感官庇護所，哪些是感官負擔區？",
    a: "陽明山、南港山系、文山山區為主要感官庇護所（得分 0.75–0.85）。感官負擔最重區域集中於環河快速道路、忠孝東西路及萬華老市區（得分 0.16–0.35）。",
  },
  {
    num: "03",
    q: "感官不均等是否與人口結構產生空間關聯？",
    a: "初步觀察到局部關聯：高學歷人口傾向聚居於高感受度區域（感官特權）；部分高齡人口分布於感官負擔較重的老市區（感官剝奪）。但因果關係仍需進一步驗證。",
  },
];

export default function App() {
  const [active, setActive] = useState(layers[0]);
  const [tab, setTab] = useState("method");
  const [visible, setVisible] = useState(false);
  const [flipped, setFlipped] = useState({});

  useEffect(() => {
    // 預載所有地圖圖片（立即執行，不等 fade-in timeout）
    layers.forEach(l => { const img = new window.Image(); img.src = l.image; });
    setTimeout(() => setVisible(true), 100);
  }, []);

  const toggleFlip = (num) => {
    setFlipped((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <div className={`app ${visible ? "loaded" : ""}`}>
      {/* Hero */}
      <header className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(/maps/sensory.png)` }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-meta">
            <span className="chip">GIS Final Project</span>
            <span className="chip">Group 4 · NTU Geography</span>
          </div>
          <h1>
            台北市<br />
            <em>感官生存指南</em>
          </h1>
          <p className="hero-sub">
            Mapping the Invisible City —<br />
            聲景・氣味・視覺・空氣品質的空間不均等
          </p>
          <div className="hero-scroll">↓ scroll</div>
        </div>
      </header>

      {/* Motivation */}
      <section className="section motivation-section">
        <div className="section-label">Research Motivation</div>
        <h2>為什麼要做這個研究？</h2>
        <div className="motivation-grid">
          <div className="motivation-card">
            <div className="motivation-icon">👁</div>
            <h4>城市感知的不可見面</h4>
            <p>現有都市評估以交通量、土地使用為核心，忽略了氣味、聲音、視覺綠意等感官體驗對生活品質的真實影響。</p>
          </div>
          <div className="motivation-card">
            <div className="motivation-icon">🗺</div>
            <h4>台北是感官密度極高的城市</h4>
            <p>夜市氣味、幹道車流、山林靜謐、老舊街廓——這些感官體驗在一般地圖上幾乎是不可見的，卻真實影響著居民生活。</p>
          </div>
          <div className="motivation-card">
            <div className="motivation-icon">⚖</div>
            <h4>感官資源的空間不平等</h4>
            <p>某些人每天生活在噪音、廢氣與惡臭的複合環境中，另一群人卻能隨時接觸綠意、清靜與新鮮空氣，這樣的差距值得被量化。</p>
          </div>
        </div>
      </section>

      {/* Method Flow */}
      <section className="section flow-section">
        <div className="section-label">Methodology</div>
        <h2>代理指標策略</h2>
        <div className="flow-wrap">
          <div className="flow-row">
            {["聲景 35%", "氣味 25%", "NDVI 25%", "PM2.5 15%"].map((item, i) => (
              <div key={i} className="flow-item">
                <span>{item}</span>
              </div>
            ))}
            <div className="flow-arrow">→</div>
            <div className="flow-result">感受度綜合指數</div>
          </div>
          <div className="flow-row">
            {["高齡人口比例", "高學歷人口比例"].map((item, i) => (
              <div key={i} className="flow-item flow-item-eq">
                <span>{item}</span>
              </div>
            ))}
            <div className="flow-arrow">→</div>
            <div className="flow-result flow-result-eq">感官不平等分析</div>
          </div>
        </div>
        <p className="flow-note">
          所有圖層標準化至 0–1（高值 = 感受好），以 Raster Calculator 加權疊合。<br />
          座標系：TWD97 TM2 Zone 121（EPSG:3826）｜空間解析度：20m × 20m
        </p>
      </section>

      {/* Map Gallery */}
      <section className="section map-section">
        <div className="section-label">Interactive Map Gallery</div>
        <h2>七張感官地圖</h2>

        <div className="layer-tabs">
          {layers.map((l) => (
            <button
              key={l.id}
              className={`layer-tab ${active.id === l.id ? "active" : ""}`}
              style={active.id === l.id ? { borderColor: l.color, color: l.color } : {}}
              onClick={() => { setActive(l); setTab("method"); }}
            >
              <span className="tab-tag" style={{ background: tagColors[l.tag] }}>{l.tag}</span>
              {l.zh}
            </button>
          ))}
        </div>

        <div className="map-layout">
          <div className="map-frame">
            <img src={active.image} alt={active.zh} />
          </div>
          <div className="map-info">
            <div className="info-header">
              <span className="info-tag" style={{ background: tagColors[active.tag] }}>{active.tag}</span>
              <h3>{active.zh}</h3>
              <p className="info-en">{active.en}</p>
            </div>

            <div className="info-tabs">
              {["method", "limitation", "finding"].map((t) => (
                <button
                  key={t}
                  className={`info-tab ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {{ method: "分析方法", limitation: "研究限制", finding: "主要發現" }[t]}
                </button>
              ))}
            </div>

            <div className="info-body">
              {tab === "method" && <p>{active.method}</p>}
              {tab === "limitation" && <p>{active.limitation}</p>}
              {tab === "finding" && <p>{active.finding}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Findings */}
      <section className="section findings-section">
        <div className="section-label">Key Findings</div>
        <h2>主要發現</h2>
        <div className="findings-grid">
          {[
            {
              icon: "🏔",
              title: "山區構成感官庇護核心",
              body: "陽明山、南港山系、文山山區的感受度得分最高（接近 0.85），形成包圍城市的感官庇護環帶。",
            },
            {
              icon: "🛣",
              title: "交通廊帶形成感官負擔",
              body: "快速道路與主要幹道沿線感受度最低，萬華區因噪音、氣味與植被稀少三重效應成為最集中的感官負擔熱區。",
            },
            {
              icon: "👴",
              title: "局部高齡感官剝奪",
              body: "部分老市區（萬華、大同）高齡人口與較高感官負擔空間重疊，初步支持感官環境剝奪的環境正義假說。",
            },
            {
              icon: "🎓",
              title: "感官特權的空間聚集",
              body: "天母、大安、內湖科學園區周邊呈現高學歷×高感受度的空間共聚，陽明山麓為感官特權最顯著區域。",
            },
          ].map((f, i) => (
            <div className="finding-card" key={i}>
              <div className="finding-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Research Questions — flip cards */}
      <section className="section rq-section">
        <div className="section-label">Research Questions</div>
        <h2>我們試圖回答三個問題</h2>
        <p className="rq-hint">點擊卡片查看答案</p>
        <div className="rq-grid">
          {rqItems.map((item) => (
            <div
              key={item.num}
              className={`rq-card ${flipped[item.num] ? "flipped" : ""}`}
              onClick={() => toggleFlip(item.num)}
            >
              <div className="rq-inner">
                {/* invisible spacer — sizes card to fit the longer face */}
                <div className="rq-sizer" aria-hidden="true">
                  <span className="rq-num">{item.num}</span>
                  <p>{item.a.length > item.q.length ? item.a : item.q}</p>
                  <span className="rq-tap">點擊翻面 →</span>
                </div>
                <div className="rq-front">
                  <span className="rq-num">{item.num}</span>
                  <p>{item.q}</p>
                  <span className="rq-tap">點擊翻面 →</span>
                </div>
                <div className="rq-back">
                  <span className="rq-num">{item.num}</span>
                  <p>{item.a}</p>
                  <span className="rq-tap">← 點擊返回</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Limitations */}
      <section className="section limit-section">
        <div className="section-label">Limitations</div>
        <h2>整體研究限制</h2>
        <ul className="limit-list">
          {[
            "本研究使用代理指標（Proxy Variables），不等於居民主觀感受或實地感官量測資料。",
            "NDVI 為衛星俯視視角，無法代表行人街道層級的綠視率（GVI）。",
            "氣味圖層無法反映實際氣味強度、營業時間、季節與風向變化，且部分自然林地未被 OSM 收錄。",
            "PM2.5 圖層測站稀疏，IDW 插值適合呈現城市尺度趨勢，不能代表街道尺度即時污染暴露。",
            "人口疊合為探索性空間分析，不能建立因果推論，也不能從區域結果推論至個人層次。",
          ].map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>台北市感官生存指南｜NTU Department of Geography｜Group 4</p>
        <p>TWD97 TM2 Zone 121（EPSG:3826）｜Cell size: 20m × 20m</p>
        <p>Data: OpenStreetMap · Copernicus Sentinel-2 · Taiwan EPA · SEGIS</p>
      </footer>
    </div>
  );
}
