
import React from 'react';

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
  const headerHeight = Math.floor(labelHeight * 0.15);
  const hmisHeight = Math.floor(labelHeight * 0.10);
  const infoHeight = Math.floor(labelHeight * 0.50);
  const pictosHeight = Math.floor(labelHeight * 0.20);
  const footerHeight = Math.floor(labelHeight * 0.05);

  const hmisWidthEach = Math.floor(labelWidth / 4);
  const hmisBoxHeight = Math.floor(hmisHeight * 0.7 * 1.25);
  const pictogramSize = Math.floor(hmisBoxHeight * 2);
  const padding = Math.floor(labelWidth * 0.02);

  const baseFontSize = Math.max(4, Math.floor(hmisBoxHeight * 0.1));
  const titleFontSize = Math.max(8, Math.floor(hmisBoxHeight * 0.5));
  const headerFontSize = Math.max(6, Math.floor(baseFontSize * 1.5));
  const bodyFontSize = Math.max(5, baseFontSize);
  const smallFontSize = Math.max(4, Math.floor(baseFontSize * 0.8));
  const hmisFontSize = Math.max(6, Math.floor(hmisBoxHeight * 0.8));

  // OSHA-compliant GHS pictogram mapping
  const pictograms = [
    { id: "exclamation", name: "Exclamation Mark", imageUrl: "/lovable-uploads/6cd8b649-2ebf-4e28-8997-a92c02012e71.png" },
    { id: "health_hazard", name: "Health Hazard", imageUrl: "/lovable-uploads/50920ae1-4fe6-4a57-a06e-ac06fc8f011a.png" },
    { id: "gas_cylinder", name: "Gas Cylinder", imageUrl: "/lovable-uploads/cf10d450-6275-49c6-85d7-c048c8964caf.png" },
    { id: "corrosion", name: "Corrosion", imageUrl: "/lovable-uploads/0b533868-23ee-4e7d-ad06-4e2f7c3ec70d.png" },
    { id: "skull_crossbones", name: "Skull and Crossbones", imageUrl: "/lovable-uploads/13dd5aab-1662-4d57-8504-c0dd39e5d60d.png" },
    { id: "exploding_bomb", name: "Exploding Bomb", imageUrl: "/lovable-uploads/bb58bdf6-4847-4243-8e98-c8cf73ec723b.png" },
    { id: "flame", name: "Flame", imageUrl: "/lovable-uploads/58fd609e-022c-4776-92d3-55935a27ad11.png" },
    { id: "flame_over_circle", name: "Flame Over Circle", imageUrl: "/lovable-uploads/2d8f3e54-3799-46c7-8b16-cd21d9f33c97.png" },
    { id: "environment", name: "Environment", imageUrl: "/lovable-uploads/d45076d9-8aba-4589-94a1-f97424d3f2ae.png" }
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
    if (!pictogram) return null;
    
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
        fontFamily: 'monospace' 
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div 
          className="text-center border-b-2 border-black" 
          style={{ 
            height: `${headerHeight}px`, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            padding: `${Math.floor(padding/2)}px 0` 
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

        {/* HMIS - shifted down */}
        <div 
          className="flex justify-between items-center" 
          style={{ 
            height: `${hmisHeight}px`, 
            padding: `${Math.floor(padding/2)}px 0`, 
            marginTop: '24px' 
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
                    marginTop: '2px' 
                  }}
                >
                  {label}
                </div>
                <div 
                  className={`hmis-box ${type ? getHazardColor(value as string, type as any) : 'bg-white'} ${type ? 'text-white' : 'text-black'} font-bold border border-black`} 
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
            padding: `${padding}px`, 
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
              <div style={{ marginTop: `${padding}px` }}>
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
                  {selectedHazards.slice(0, 3).map((hazard, index) => (
                    <div key={index} style={{ marginBottom: `${Math.floor(padding/4)}px` }}>
                      {hazard}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pictograms */}
            {selectedPictograms.length > 0 && (
              <div 
                style={{ 
                  marginTop: `${padding}px`, 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: `${Math.floor(padding/2)}px`, 
                  justifyContent: 'flex-start', 
                  alignItems: 'flex-start' 
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
                      justifyContent: 'center' 
                    }}
                  >
                    {getHazardIcon(pictogramId, pictogramSize)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{ 
            height: `${footerHeight}px`, 
            borderTop: '2px solid black', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-start', 
            padding: `${Math.floor(padding/2)}px 0` 
          }}
        >
          <div 
            className="font-bold" 
            style={{ 
              fontSize: `${bodyFontSize}px`, 
              textAlign: 'left', 
              paddingLeft: `${padding}px` 
            }}
          >
            {getSpecificPPE()} • VENTILATION REQUIRED
          </div>
        </div>
      </div>
    </div>
  );
}
