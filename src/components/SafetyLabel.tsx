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
  selectedPictograms: string[];
  selectedHazards: string[];
  ppeRequirements: string[];
  labelWidth?: number;
  labelHeight?: number;
}

// Helper function to get H-code explanations
const getHCodeExplanation = (hCode: string) => {
  const hCodes: {[key: string]: string} = {
    'H225': 'Highly flammable liquid and vapor',
    'H226': 'Flammable liquid and vapor',
    'H227': 'Combustible liquid',
    'H228': 'Flammable solid',
    'H229': 'Pressurized container: may burst if heated',
    'H301': 'Toxic if swallowed',
    'H302': 'Harmful if swallowed',
    'H303': 'May be harmful if swallowed',
    'H304': 'May be fatal if swallowed and enters airways',
    'H305': 'May be harmful if swallowed and enters airways',
    'H311': 'Toxic in contact with skin',
    'H312': 'Harmful in contact with skin',
    'H313': 'May be harmful in contact with skin',
    'H314': 'Causes severe skin burns and eye damage',
    'H315': 'Causes skin irritation',
    'H316': 'Causes mild skin irritation',
    'H317': 'May cause an allergic skin reaction',
    'H318': 'Causes serious eye damage',
    'H319': 'Causes serious eye irritation',
    'H320': 'Causes eye irritation',
    'H330': 'Fatal if inhaled',
    'H331': 'Toxic if inhaled',
    'H332': 'Harmful if inhaled',
    'H333': 'May be harmful if inhaled',
    'H334': 'May cause allergy or asthma symptoms or breathing difficulties if inhaled',
    'H335': 'May cause respiratory irritation',
    'H336': 'May cause drowsiness or dizziness',
    'H340': 'May cause genetic defects',
    'H341': 'Suspected of causing genetic defects',
    'H350': 'May cause cancer',
    'H351': 'Suspected of causing cancer',
    'H360': 'May damage fertility or the unborn child',
    'H361': 'Suspected of damaging fertility or the unborn child',
    'H362': 'May cause harm to breast-fed children',
    'H370': 'Causes damage to organs',
    'H371': 'May cause damage to organs',
    'H372': 'Causes damage to organs through prolonged or repeated exposure',
    'H373': 'May cause damage to organs through prolonged or repeated exposure',
    'H400': 'Very toxic to aquatic life',
    'H401': 'Toxic to aquatic life',
    'H402': 'Harmful to aquatic life',
    'H410': 'Very toxic to aquatic life with long lasting effects',
    'H411': 'Toxic to aquatic life with long lasting effects',
    'H412': 'Harmful to aquatic life with long lasting effects',
    'H413': 'May cause long lasting harmful effects to aquatic life'
  };
  
  // Match H-code pattern
  const hCodeMatch = hCode.match(/H\d{3}/i);
  if (hCodeMatch) {
    const code = hCodeMatch[0].toUpperCase();
    return `${code}: ${hCodes[code] || 'Hazardous material'}`;
  }
  
  return hCode;
};

// Helper function to deduplicate pictograms
function getUniquePictograms(pictograms: any[]) {
  const normalized = pictograms.map(p => {
    const pictogramString = typeof p === 'string' ? p : (p as any)?.name || 'warning';
    return pictogramString.toLowerCase().replace(/[^a-z0-9]/g, '');
  });
  
  const unique = [];
  const seen = new Set();
  
  for (let i = 0; i < pictograms.length; i++) {
    const normalizedPictogram = normalized[i];
    
    // Map similar pictograms to canonical names
    let canonicalName = normalizedPictogram;
    if (normalizedPictogram.includes('flame') || normalizedPictogram.includes('flammable')) {
      canonicalName = 'ghs02';
    } else if (normalizedPictogram.includes('corros') || normalizedPictogram.includes('acid')) {
      canonicalName = 'ghs05';
    } else if (normalizedPictogram.includes('toxic') || normalizedPictogram.includes('skull')) {
      canonicalName = 'ghs06';
    } else if (normalizedPictogram.includes('health') || normalizedPictogram.includes('carcinogen')) {
      canonicalName = 'ghs08';
    } else if (normalizedPictogram.includes('exclamation') || normalizedPictogram.includes('irritant') || normalizedPictogram.includes('harmful')) {
      canonicalName = 'ghs07';
    } else if (normalizedPictogram.includes('explosive') || normalizedPictogram.includes('bomb')) {
      canonicalName = 'ghs01';
    } else if (normalizedPictogram.includes('oxidiz') || normalizedPictogram.includes('oxidis')) {
      canonicalName = 'ghs03';
    } else if (normalizedPictogram.includes('gas') || normalizedPictogram.includes('cylinder')) {
      canonicalName = 'ghs04';
    } else if (normalizedPictogram.includes('environment') || normalizedPictogram.includes('aquatic')) {
      canonicalName = 'ghs09';
    }
    
    if (!seen.has(canonicalName)) {
      seen.add(canonicalName);
      unique.push(pictograms[i]);
    }
  }
  
  return unique;
}

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
  labelWidth = 288, 
  labelHeight = 192 
}: SafetyLabelProps) {
  // Calculate proportional sizes based on label dimensions
  const scaleFactor = Math.min(labelWidth / 288, labelHeight / 192);
  
  // Proportional spacing and sizing
  const padding = Math.max(2, Math.floor(labelWidth * 0.02));
  const verticalSpacing = Math.max(3, Math.floor(labelHeight * 0.015));
  
  // Section heights (as percentage of total)
  const headerHeight = Math.floor(labelHeight * 0.15);
  const hmisHeight = Math.floor(labelHeight * 0.12);
  const infoHeight = Math.floor(labelHeight * 0.48);
  const footerHeight = Math.floor(labelHeight * 0.05);

  // HMIS box dimensions
  const hmisWidthEach = Math.floor(labelWidth / 4);
  const hmisBoxHeight = Math.floor(hmisHeight * 0.7);
  const pictogramSize = Math.max(30 * scaleFactor, Math.floor(labelHeight * 0.15));
  
  // Calculated font sizes
  const baseFontSize = Math.max(7, Math.floor(8 * scaleFactor));
  const titleFontSize = Math.max(11, Math.floor(14 * scaleFactor));
  const headerFontSize = Math.max(9, Math.floor(10 * scaleFactor));
  const bodyFontSize = Math.max(8, Math.floor(9 * scaleFactor));
  const smallFontSize = Math.max(7, Math.floor(8 * scaleFactor));
  const hmisFontSize = Math.max(10, Math.floor(12 * scaleFactor));

  // OSHA-compliant GHS pictogram mapping using Supabase storage
  const pictograms = [
    { id: "exclamation", name: "Exclamation Mark", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/exclamation.png" },
    { id: "health_hazard", name: "Health Hazard", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/health_hazard.png" },
    { id: "gas_cylinder", name: "Gas Cylinder", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/gas_cylinder.png" },
    { id: "corrosion", name: "Corrosion", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/corrosion.png" },
    { id: "skull_crossbones", name: "Skull and Crossbones", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/skull_crossbones.png" },
    { id: "exploding_bomb", name: "Exploding Bomb", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/exploding_bomb.png" },
    { id: "flame", name: "Flame", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/flame.png" },
    { id: "flame_over_circle", name: "Flame Over Circle", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/flame_over_circle.png" },
    { id: "environment", name: "Environment", imageUrl: "https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/pictograms/environment.png" }
  ];

  const getSpecificPPE = () => {
    if (ppeRequirements.length > 0) {
      return ppeRequirements.join(" • ");
    }
    
    // Generate PPE based on HMIS ratings if no specific PPE provided
    const ppeItems = [];
    const healthLevel = parseInt(hmisHealth);
    const flammabilityLevel = parseInt(hmisFlammability);
    const physicalLevel = parseInt(hmisPhysical);
    
    if (healthLevel >= 3) {
      ppeItems.push("FULL FACE RESPIRATOR");
    } else if (healthLevel >= 2) {
      ppeItems.push("RESPIRATOR");
    }
    if (flammabilityLevel >= 3 || physicalLevel >= 3) {
      ppeItems.push("FIRE RESISTANT CLOTHING");
    }
    
    if (selectedPictograms.includes('corrosion')) {
      ppeItems.push("CHEMICAL RESISTANT GLOVES");
      ppeItems.push("FACE SHIELD");
    } else {
      ppeItems.push("SAFETY GLOVES");
    }
    
    if (selectedPictograms.includes('skull_crossbones')) {
      ppeItems.push("FULL BODY PROTECTION");
    }
    
    if (!ppeItems.some(item => item.includes("GLOVES"))) {
      ppeItems.push("SAFETY GLOVES");
    }
    ppeItems.push("SAFETY GLASSES");
    return ppeItems.join(" • ");
  };

  // Updated HMIS colors - proper red, yellow, blue (not pastels)
  const getHazardColor = (level: string, type: 'health' | 'flammability' | 'reactivity') => {
    const levelNum = parseInt(level);
    if (isNaN(levelNum)) return 'bg-gray-500';
    
    switch (type) {
      case 'health':
        return levelNum >= 3 ? 'bg-blue-700' : levelNum >= 2 ? 'bg-blue-600' : levelNum >= 1 ? 'bg-blue-500' : 'bg-blue-400';
      case 'flammability':
        return levelNum >= 3 ? 'bg-red-700' : levelNum >= 2 ? 'bg-red-600' : levelNum >= 1 ? 'bg-red-500' : 'bg-red-400';
      case 'reactivity':
        return levelNum >= 3 ? 'bg-yellow-500' : levelNum >= 2 ? 'bg-yellow-400' : levelNum >= 1 ? 'bg-yellow-300' : 'bg-yellow-200';
      default:
        return 'bg-gray-500';
    }
  };

  const getHazardIcon = (pictogramId: string, size: number) => {
    const pictogram = pictograms.find(p => p.id === pictogramId);
    
    if (!pictogram) {
      // Try alternative matching
      const alternativeMatch = pictograms.find(p => 
        p.name.toLowerCase().includes(pictogramId.replace(/_/g, ' ')) ||
        pictogramId.toLowerCase().includes(p.id.replace(/_/g, ' '))
      );
      
      if (alternativeMatch) {
        return (
          <img 
            src={alternativeMatch.imageUrl} 
            alt={alternativeMatch.name}
            style={{ 
              width: `${size}px`, 
              height: `${size}px`, 
              objectFit: 'contain' as const,
              aspectRatio: '1 / 1'
            }}
          />
        );
      }
      
      return (
        <div 
          style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.floor(size * 0.1)}px`,
            color: '#6b7280'
          }}
        >
          {pictogramId}
        </div>
      );
    }
    
    return (
      <img 
        src={pictogram.imageUrl} 
        alt={pictogram.name}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          objectFit: 'contain' as const,
          aspectRatio: '1 / 1'
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  };

  return (
    <div 
      className="safety-label bg-white border-2 border-black print:border-black" 
      style={{ 
        width: `${labelWidth}px`, 
        height: `${labelHeight}px`, 
        padding: `${padding}px`, 
        fontSize: `${bodyFontSize}px`, 
        fontFamily: 'monospace',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header - REDUCED SPACE */}
        <div 
          className="text-center border-b-2 border-black" 
          style={{ 
            minHeight: `${headerHeight}px`, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            padding: `0px 0` // Removed padding to reduce space
          }}
        >
          <h4 
            className="font-bold uppercase" 
            style={{ 
              fontSize: `${titleFontSize}px`, 
              lineHeight: '1.2', 
              margin: 0 
            }}
          >
            {productName}
          </h4>
          {chemicalCompound && (
            <div 
              className="font-medium" 
              style={{ 
                fontSize: `${headerFontSize}px`, 
                lineHeight: '1.1', 
                margin: 0 
              }}
            >
              {chemicalCompound}
            </div>
          )}
          {chemicalFormula && (
            <div 
              style={{ 
                fontSize: `${bodyFontSize}px`, 
                lineHeight: '1.1', 
                margin: 0 
              }}
            >
              {chemicalFormula}
            </div>
          )}
        </div>

        {/* HMIS - BLACK TEXT ON YELLOW */}
        <div 
          className="flex justify-between items-center" 
          style={{ 
            minHeight: `${hmisHeight}px`, 
            padding: `${Math.floor(padding)}px 0 ${Math.floor(padding/2)}px 0`
          }}
        >
          <div className="flex" style={{ gap: `${Math.floor(padding/2)}px` }}>
            {[
              ['H', hmisHealth, 'health'], 
              ['F', hmisFlammability, 'flammability'], 
              ['R', hmisPhysical, 'reactivity'], 
              ['PPE', hmisSpecial || 'A', null]
            ].map(([label, value, type], i) => (
              <div className="text-center" key={i}>
                <div 
                  className="font-bold" 
                  style={{ 
                    fontSize: `${smallFontSize}px`, 
                    marginBottom: `${Math.floor(padding/4)}px`, 
                    lineHeight: '1.2', 
                    marginTop: '6px' // Increased top margin
                  }}
                >
                  {label}
                </div>
                <div 
                  className={`hmis-box ${type ? getHazardColor(value as string, type as any) : 'bg-white'} ${type === 'reactivity' ? 'text-black' : type ? 'text-white' : 'text-black'} font-bold border border-black`} 
                  style={{ 
                    width: `${hmisWidthEach - padding}px`, 
                    height: `${hmisBoxHeight}px`, 
                    fontSize: `${hmisFontSize}px`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    lineHeight: '1' 
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Zone */}
        <div 
          style={{ 
            height: `${infoHeight}px`, 
            padding: `${verticalSpacing * 2}px ${padding}px ${padding}px`, // Added top spacing after HMIS
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-start' 
          }}
        >
          <div style={{ fontSize: `${bodyFontSize}px`, lineHeight: '1.2' }}>
            {casNumber && (
              <div style={{ fontSize: `${bodyFontSize}px` }}>
                <span className="font-bold">CAS:</span> {casNumber}
              </div>
            )}
            {manufacturer && (
              <div style={{ fontSize: `${bodyFontSize}px` }}>
                <span className="font-bold">MFG:</span> {manufacturer}
              </div>
            )}
            {productId && (
              <div style={{ fontSize: `${bodyFontSize}px` }}>
                <span className="font-bold">ID:</span> {productId}
              </div>
            )}
            
            {selectedHazards.length > 0 && (
              <div style={{ marginTop: `${verticalSpacing}px` }}>
                <div 
                  className="font-bold" 
                  style={{ 
                    marginBottom: `${Math.floor(padding/2)}px`,
                    fontSize: `${bodyFontSize}px`
                  }}
                >
                  HAZARDS:
                </div>
                <div style={{ fontSize: `${smallFontSize}px`, lineHeight: '1.1' }}>
                  {selectedHazards.slice(0, 3).map((hazard, index) => {
                    // Check if this is an H-code and expand it
                    const expandedHazard = getHCodeExplanation(hazard);
                    return (
                      <div key={index} style={{ marginBottom: `${Math.floor(padding/4)}px` }}>
                        {expandedHazard}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pictograms */}
            {selectedPictograms.length > 0 && (
              <div 
                style={{ 
                  marginTop: `${verticalSpacing}px`, 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: `${Math.floor(padding/2)}px`, 
                  justifyContent: 'flex-start', 
                  alignItems: 'center' 
                }}
              >
                {selectedPictograms.slice(0, 4).map((pictogramId, index) => (
                  <div 
                    key={`${pictogramId}-${index}`} 
                    style={{ 
                      width: `${pictogramSize}px`, 
                      height: `${pictogramSize}px`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getHazardIcon(pictogramId, pictogramSize)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - SMALLER TEXT AND ANCHORED TO BOTTOM */}
        <div 
          style={{ 
            borderTop: '2px solid black',
            position: 'absolute',
            bottom: `${padding}px`,
            left: `${padding}px`,
            right: `${padding}px`,
            display: 'flex',
            alignItems: 'center',
            height: `${footerHeight}px`,
            minHeight: '15px'
          }}
        >
          <div 
            className="font-bold" 
            style={{ 
              fontSize: `${Math.floor(smallFontSize * 0.8)}px`, // Reduced font size
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {getSpecificPPE()} • VENTILATION REQUIRED
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyLabel;
