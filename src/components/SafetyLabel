import React from 'react';

interface SafetyLabelProps {
  productName: string;
  manufacturer?: string;
  chemicalFormula?: string;
  chemicalCompound?: string;
  casNumber?: string;
  productId?: string;
  hmisHealth: string;
  hmisFlammability: string;
  hmisPhysical: string;
  hmisSpecial?: string;
  selectedPictograms: string[]; // e.g., ['flame', 'exclamation']
  selectedHazards: string[];    // e.g., ['H225', 'H315']
  ppeRequirements: string[];
  labelWidth?: number;          // ignored: fixed 300x225 for pixel-perfect capture
  labelHeight?: number;         // ignored: fixed 300x225 for pixel-perfect capture
  signalWord?: string;          // e.g., 'DANGER' | 'WARNING'
}

// --- Inline GHS SVGs -------------------------------------------------------
// NOTE: All shapes are inline to avoid CORS/network issues with html2canvas.
// Each pictogram is drawn inside a 100x100 viewBox and scaled by size prop.

const Diamond: React.FC<{ children?: React.ReactNode }>
  = ({ children }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Red diamond border */}
    <polygon points="50,5 95,50 50,95 5,50" fill="#fff" stroke="#d00000" strokeWidth="10" />
    {/* Content slot */}
    {children}
  </svg>
);

const Pictos = {
  exclamation: () => (
    <Diamond>
      <text x="50" y="64" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="64">!</text>
    </Diamond>
  ),
  health_hazard: () => (
    <Diamond>
      {/* simplified torso/star symbol */}
      <path d="M50 25 a14 14 0 1 0 0.1 0Z" fill="#000" />
      <path d="M50 40 l-18 28 h36Z" fill="#000" />
      <path d="M50 40 l0 30" stroke="#fff" strokeWidth="4" />
    </Diamond>
  ),
  gas_cylinder: () => (
    <Diamond>
      <rect x="30" y="45" width="40" height="12" rx="2" ry="2" fill="#000" />
      <rect x="26" y="48" width="6" height="6" fill="#000" />
    </Diamond>
  ),
  corrosion: () => (
    <Diamond>
      {/* test tube */}
      <rect x="30" y="25" width="10" height="20" fill="#000" />
      <rect x="60" y="25" width="10" height="20" fill="#000" />
      {/* hand & surface */}
      <rect x="20" y="70" width="60" height="6" fill="#000" />
      <rect x="40" y="62" width="30" height="6" transform="rotate(-20 40 62)" fill="#000" />
      <rect x="28" y="58" width="12" height="10" fill="#000" />
    </Diamond>
  ),
  skull_crossbones: () => (
    <Diamond>
      <circle cx="50" cy="44" r="12" fill="#000" />
      <circle cx="45" cy="42" r="2" fill="#fff" />
      <circle cx="55" cy="42" r="2" fill="#fff" />
      <path d="M35 60 l30 0" stroke="#000" strokeWidth="10" />
      <path d="M35 60 l30 0" stroke="#fff" strokeWidth="4" />
      <path d="M35 60 l30 0" stroke="#000" strokeWidth="2" transform="rotate(25 50 60)" />
      <path d="M35 60 l30 0" stroke="#000" strokeWidth="2" transform="rotate(-25 50 60)" />
    </Diamond>
  ),
  exploding_bomb: () => (
    <Diamond>
      <circle cx="45" cy="55" r="12" fill="#000" />
      <rect x="53" y="41" width="20" height="6" transform="rotate(30 53 41)" fill="#000" />
      <polygon points="72,37 85,28 80,40" fill="#000" />
      <line x1="62" y1="45" x2="85" y2="28" stroke="#000" strokeWidth="3" />
    </Diamond>
  ),
  flame: () => (
    <Diamond>
      <path d="M50 70c10-8 10-16 2-24-3 6-7 8-10 5-3-3-3-8 1-14-12 7-15 22-5 31 5 4 8 5 12 2Z" fill="#000" />
    </Diamond>
  ),
  flame_over_circle: () => (
    <Diamond>
      <circle cx="50" cy="62" r="12" fill="none" stroke="#000" strokeWidth="6" />
      <path d="M50 50c8-6 8-12 2-18-3 5-6 6-8 4-2-2-2-6 0-10-9 6-11 16-3 22 4 3 6 3 9 2Z" fill="#000" />
    </Diamond>
  ),
  environment: () => (
    <Diamond>
      <path d="M25 70 h50 v6 h-50z" fill="#000" />
      <polygon points="35,70 65,70 50,45" fill="#000" />
      <circle cx="38" cy="50" r="3" fill="#fff" />
    </Diamond>
  )
} as const;

// Map loose names to canonical ids
const normalizePictogramId = (id: string): keyof typeof Pictos | null => {
  const x = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (x.includes('exclam') || x.includes('harmful') || x === 'ghs07') return 'exclamation';
  if (x.includes('health') || x.includes('carcin') || x === 'ghs08') return 'health_hazard';
  if (x.includes('gas') || x.includes('cylinder') || x === 'ghs04') return 'gas_cylinder';
  if (x.includes('corros') || x.includes('acid') || x === 'ghs05') return 'corrosion';
  if (x.includes('skull') || x.includes('toxic') || x === 'ghs06') return 'skull_crossbones';
  if (x.includes('explod') || x.includes('bomb') || x === 'ghs01') return 'exploding_bomb';
  if (x.includes('flameover') || x.includes('oxid') || x === 'ghs03') return 'flame_over_circle';
  if (x.includes('flame') || x.includes('flamm') || x === 'ghs02') return 'flame';
  if (x.includes('env') || x.includes('aquatic') || x === 'ghs09') return 'environment';
  return null;
};

// --- Helpers ---------------------------------------------------------------
const getHCodeExplanation = (hCode: string) => {
  const h = hCode.toUpperCase();
  const map: Record<string,string> = {
    H225: 'Highly flammable liquid and vapor',
    H226: 'Flammable liquid and vapor',
    H228: 'Flammable solid',
    H301: 'Toxic if swallowed',
    H302: 'Harmful if swallowed',
    H304: 'May be fatal if swallowed and enters airways',
    H311: 'Toxic in contact with skin',
    H312: 'Harmful in contact with skin',
    H314: 'Causes severe skin burns and eye damage',
    H315: 'Causes skin irritation',
    H319: 'Causes serious eye irritation',
    H330: 'Fatal if inhaled',
    H331: 'Toxic if inhaled',
    H332: 'Harmful if inhaled',
    H335: 'May cause respiratory irritation',
    H336: 'May cause drowsiness or dizziness',
    H351: 'Suspected of causing cancer',
    H370: 'Causes damage to organs',
    H372: 'Causes damage to organs through prolonged or repeated exposure',
    H400: 'Very toxic to aquatic life',
    H410: 'Very toxic to aquatic life with long lasting effects',
  };
  const match = h.match(/H\d{3}/);
  return match ? `${match[0]}: ${map[match[0]] ?? 'Hazardous material'}` : hCode;
};

const getHazardBoxColor = (level: string, type: 'health'|'flammability'|'reactivity') => {
  const n = parseInt(level, 10);
  if (Number.isNaN(n)) return '#9ca3af';
  if (type === 'health') return n >= 3 ? '#1d4ed8' : n >= 2 ? '#2563eb' : n >= 1 ? '#3b82f6' : '#60a5fa';
  if (type === 'flammability') return n >= 3 ? '#b91c1c' : n >= 2 ? '#dc2626' : n >= 1 ? '#ef4444' : '#f87171';
  return n >= 3 ? '#eab308' : n >= 2 ? '#facc15' : n >= 1 ? '#fde047' : '#fef08a';
};

// --- Component -------------------------------------------------------------
export function SafetyLabel({
  productName,
  manufacturer,
  chemicalFormula,
  chemicalCompound,
  casNumber,
  productId,
  hmisHealth,
  hmisFlammability,
  hmisPhysical,
  hmisSpecial,
  selectedPictograms,
  selectedHazards,
  ppeRequirements,
  labelWidth = 300,
  labelHeight = 225,
  signalWord
}: SafetyLabelProps) {
  // Fixed canvas for pixel-perfect PNG capture
  const fixedWidth = 300;
  const fixedHeight = 225;

  const padding = 6;
  const headerHeight = 34;
  const hmisHeight = 27;
  const infoHeight = 108;
  const footerHeight = 14;
  const pictogramSize = 32;

  const fontStack = 'Arial, Helvetica, sans-serif'; // System-safe; no async webfonts

  const renderPictogram = (rawId: string) => {
    const id = normalizePictogramId(rawId);
    if (!id) return null;
    const Pic = Pictos[id];
    return (
      <div style={{ width: pictogramSize, height: pictogramSize }}>
        <Pic />
      </div>
    );
  };

  const specificPPE = (() => {
    if (ppeRequirements?.length) return ppeRequirements.join(' • ');
    const items: string[] = [];
    const h = parseInt(hmisHealth, 10) || 0;
    const f = parseInt(hmisFlammability, 10) || 0;
    const r = parseInt(hmisPhysical, 10) || 0;
    if (h >= 3) items.push('FULL FACE RESPIRATOR');
    else if (h >= 2) items.push('RESPIRATOR');
    if (f >= 3 || r >= 3) items.push('FIRE RESISTANT CLOTHING');
    items.push('SAFETY GLOVES', 'SAFETY GLASSES');
    return items.join(' • ');
  })();

  return (
    <div
      className="safety-label"
      style={{
        width: fixedWidth,
        height: fixedHeight,
        background: '#fff',
        border: '2px solid #000',
        padding: `2px ${padding}px ${padding}px ${padding}px`,
        fontFamily: fontStack,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          minHeight: headerHeight,
          borderBottom: '2px solid #000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2, textTransform: 'uppercase' }}>{productName}</div>
        {chemicalCompound && (
          <div style={{ fontWeight: 600, fontSize: 10, lineHeight: 1.1 }}>{chemicalCompound}</div>
        )}
        {chemicalFormula && (
          <div style={{ fontSize: 9, lineHeight: 1.1 }}>{chemicalFormula}</div>
        )}
      </div>

      {/* HMIS */}
      <div style={{ minHeight: hmisHeight, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
        {[['H', hmisHealth, 'health'], ['F', hmisFlammability, 'flammability'], ['R', hmisPhysical, 'reactivity'], ['PPE', hmisSpecial || 'A', 'none']].map(([label, value, type], i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 8, marginBottom: 2 }}>{label}</div>
            <div
              style={{
                width: 69,
                height: 18,
                border: '1px solid #000',
                background: type === 'none' ? '#fff' : getHazardBoxColor(String(value), type as any),
                color: type === 'reactivity' ? '#000' : type === 'none' ? '#000' : '#fff',
                fontWeight: 700,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Info + pictograms */}
      <div style={{ height: infoHeight, padding: `${8}px ${padding}px ${padding}px`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 9, lineHeight: 1.2 }}>
          {casNumber && (
            <div><span style={{ fontWeight: 700 }}>CAS:</span> {casNumber}</div>
          )}
          {manufacturer && (
            <div><span style={{ fontWeight: 700 }}>MFG:</span> {manufacturer}</div>
          )}
          {productId && (
            <div><span style={{ fontWeight: 700 }}>ID:</span> {productId}</div>
          )}
        </div>

        {selectedHazards?.length > 0 && (
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 9,
                marginTop: 4,
                marginBottom: 4,
                color: signalWord === 'DANGER' ? '#b91c1c' : signalWord === 'WARNING' ? '#c2410c' : '#111827',
              }}
            >
              {signalWord || 'HAZARDS'}:
            </div>
            <div style={{ fontSize: 8, lineHeight: 1.1 }}>
              {selectedHazards.slice(0, 3).map((h, idx) => (
                <div key={idx} style={{ marginBottom: 2 }}>{getHCodeExplanation(h)}</div>
              ))}
            </div>
          </div>
        )}

        {selectedPictograms?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 4 }}>
            {selectedPictograms.slice(0, 4).map((id, i) => (
              <div key={`${id}-${i}`} style={{ width: pictogramSize, height: pictogramSize }}>
                {renderPictogram(id)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer (flex-pinned to bottom) */}
      <div style={{ borderTop: '2px solid #000', display: 'flex', alignItems: 'center', minHeight: footerHeight, paddingTop: 2, marginTop: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 7.5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {specificPPE} • VENTILATION REQUIRED
        </div>
      </div>
    </div>
  );
}

export default SafetyLabel;
