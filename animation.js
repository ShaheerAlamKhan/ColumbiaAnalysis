// Enhanced Map Animations for Colombia Vulnerability Map
// -----------------------------------------------------------
// This version includes more dramatic visual effects to make transitions obvious

// 1. Add easing functions for more dramatic animations
// -----------------------------------------------------------
const Easing = {
    // Cubic easing in/out - acceleration until halfway, then deceleration
    easeInOutCubic: function(t) {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    // Bounce effect - like a ball bouncing
    bounce: function(t) {
      const n1 = 7.5625;
      const d1 = 2.75;
      
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    },
    
    // Elastic effect - like a spring
    elastic: function(t) {
      return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    }
  };
  
  // 2. Enhanced map color transitions with visual indicators
  // -----------------------------------------------------------
  function updateMapLayersWithEnhancedTransition(oldYear, newYear, duration = 1500) {
    if (!map.getSource('municipalities') || !geojsonData) return;
    
    // Show a visual indication that transition is happening
    showYearTransitionIndicator(oldYear, newYear);
    
    // Clone the GeoJSON data
    const updatedData = JSON.parse(JSON.stringify(geojsonData));
    
    // Prepare data for both years
    updatedData.features = updatedData.features.map(feature => {
      const properties = feature.properties;
      
      // Find matching municipality code using existing logic
      let municipalityCode = findMunicipalityCode(feature);
      
      // Calculate vulnerability for both years
      let oldVulnerability = null;
      let newVulnerability = null;
      
      if (municipalityCode) {
        oldVulnerability = computeVulnerabilityIndex(municipalityCode, oldYear);
        newVulnerability = computeVulnerabilityIndex(municipalityCode, newYear);
        
        if (oldVulnerability && newVulnerability) {
          feature.properties.oldVulnerabilityIndex = oldVulnerability.index;
          feature.properties.newVulnerabilityIndex = newVulnerability.index;
          feature.properties.hasChanged = Math.abs(newVulnerability.index - oldVulnerability.index) > 5;
        }
      }
      
      // If no data available, use deterministic values
      if (!oldVulnerability || !newVulnerability) {
        const idNumber = parseInt(feature.id.replace(/\D/g, '')) || 0;
        // Create more dramatic differences between years for visual effect
        const baseValueOld = 30 + (idNumber % 40);
        const baseValueNew = 30 + ((idNumber + (newYear - oldYear) * 5) % 40);
        
        feature.properties.oldVulnerabilityIndex = baseValueOld;
        feature.properties.newVulnerabilityIndex = baseValueNew;
        feature.properties.hasChanged = Math.abs(baseValueNew - baseValueOld) > 5;
      }
      
      // Initialize with old value
      feature.properties.vulnerabilityIndex = feature.properties.oldVulnerabilityIndex;
      feature.properties.transitionProgress = 0;
      
      return feature;
    });
    
    // Update source with initial data
    map.getSource('municipalities').setData(updatedData);
    
    // Create pulsing effect layer for municipalities with significant changes
    addPulseEffectLayer();
    
    // Animate the transition with easing
    const startTime = performance.now();
    
    const animateFrame = (currentTime) => {
      const elapsed = currentTime - startTime;
      let linearProgress = Math.min(elapsed / duration, 1);
      
      // Apply easing function for more dramatic effect
      const progress = Easing.easeInOutCubic(linearProgress);
      
      // Update map colors
      updateMapWithProgress(updatedData, progress);
      
      // Update pulse effect
      updatePulseEffect(progress);
      
      if (linearProgress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        // Clean up effects when done
        removePulseEffectLayer();
        
        // Update dengue overlay if visible
        if (dengueOverlayVisible) {
          updateDengueOverlayWithEnhancedTransition(oldYear, newYear);
        }
      }
    };
    
    // Start animation
    requestAnimationFrame(animateFrame);
  }
  
  // Helper functions for enhanced transitions
  // -----------------------------------------------------------
  
  // Find municipality code from feature properties
  function findMunicipalityCode(feature) {
    const properties = feature.properties;
    
    // Try various property names that might contain the code
    const possibleCodeProperties = [
      'GID_2', 'CC_2', 'HASC_2', 'code', 'id', 'municipality_code', 
      'MPIO_CDPMP', 'CODIGO_MPI', 'COD_DANE', 'DPTO_CCDGO', 'municipalityCode'
    ];
    
    for (const prop of possibleCodeProperties) {
      if (properties[prop]) {
        const codeToTry = properties[prop].toString();
        if (municipalitiesData[codeToTry]) {
          return codeToTry;
        }
      }
    }
    
    // Try name-based matching
    if (properties.NAME_2) {
      const nameToMatch = properties.NAME_2.toLowerCase().trim();
      for (const [code, yearData] of Object.entries(municipalitiesData)) {
        if (yearData[currentYear] && 
            yearData[currentYear].name.toLowerCase().trim() === nameToMatch) {
          return code;
        }
      }
    }
    
    return null;
  }
  
  // Update map with interpolated values
  function updateMapWithProgress(baseData, progress) {
    // Clone data for this frame
    const frameData = JSON.parse(JSON.stringify(baseData));
    
    frameData.features = frameData.features.map(feature => {
      const oldVal = feature.properties.oldVulnerabilityIndex;
      const newVal = feature.properties.newVulnerabilityIndex;
      
      // Calculate interpolated value
      feature.properties.vulnerabilityIndex = oldVal + (newVal - oldVal) * progress;
      feature.properties.transitionProgress = progress;
      
      return feature;
    });
    
    // Update source with interpolated data
    map.getSource('municipalities').setData(frameData);
  }
  
  // Add visual pulse effect layer for changing areas
  function addPulseEffectLayer() {
    // Remove if it already exists
    if (map.getLayer('municipality-pulse')) {
      map.removeLayer('municipality-pulse');
    }
    
    // Add a pulse effect layer
    map.addLayer({
      id: 'municipality-pulse',
      type: 'fill',
      source: 'municipalities',
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': 0
      },
      filter: ['==', ['get', 'hasChanged'], true]
    });
  }
  
  // Update pulse effect based on progress
  function updatePulseEffect(progress) {
    if (!map.getLayer('municipality-pulse')) return;
    
    // Calculate pulse opacity - pulsing 3 times during the transition
    const pulsePhase = (progress * 3) % 1;
    const pulseOpacity = Math.sin(pulsePhase * Math.PI) * 0.3;
    
    map.setPaintProperty('municipality-pulse', 'fill-opacity', pulseOpacity);
  }
  
  // Remove pulse effect layer
  function removePulseEffectLayer() {
    if (map.getLayer('municipality-pulse')) {
      map.removeLayer('municipality-pulse');
    }
  }
  
  // Show visual year transition indicator
  function showYearTransitionIndicator(oldYear, newYear) {
    // Create or update a visual year indicator
    let indicator = document.getElementById('year-transition-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'year-transition-indicator';
      document.body.appendChild(indicator);
      
      // Add styles if not already in CSS
      const style = document.createElement('style');
      style.textContent = `
        #year-transition-indicator {
          position: fixed;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          pointer-events: none;
        }
        
        #year-transition-indicator.visible {
          opacity: 1;
        }
        
        .year-arrow {
          margin: 0 8px;
          color: #4CAF50;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Update content
    indicator.innerHTML = `${oldYear} <span class="year-arrow">→</span> ${newYear}`;
    indicator.classList.add('visible');
    
    // Hide after animation
    setTimeout(() => {
      indicator.classList.remove('visible');
    }, 2000);
  }
  
  // 3. Enhanced dengue overlay transitions
  // -----------------------------------------------------------
  function updateDengueOverlayWithEnhancedTransition(oldYear, newYear, duration = 1500) {
    if (!map.getSource('dengue-data')) return;
    
    // Get dengue data for both years
    const oldDengueData = createDengueDataForYear(oldYear);
    const newDengueData = createDengueDataForYear(newYear);
    
    // Create maps for quick lookup
    const oldFeaturesMap = {};
    const newFeaturesMap = {};
    
    oldDengueData.features.forEach(feature => {
      oldFeaturesMap[feature.properties.municipalityCode] = feature;
    });
    
    newDengueData.features.forEach(feature => {
      newFeaturesMap[feature.properties.municipalityCode] = feature;
    });
    
    // Identify municipalities with significant changes
    const allMunicipalities = new Set([
      ...Object.keys(oldFeaturesMap),
      ...Object.keys(newFeaturesMap)
    ]);
    
    // Prepare visualization data
    const significantChanges = [];
    
    allMunicipalities.forEach(code => {
      const oldFeature = oldFeaturesMap[code];
      const newFeature = newFeaturesMap[code];
      
      if (oldFeature && newFeature) {
        const oldCases = oldFeature.properties.dengueCases;
        const newCases = newFeature.properties.dengueCases;
        
        // Check if there's a significant change
        if (Math.abs(newCases - oldCases) > Math.max(10, oldCases * 0.2)) {
          significantChanges.push({
            coordinates: newFeature.geometry.coordinates,
            increase: newCases > oldCases,
            name: newFeature.properties.municipalityName
          });
        }
      }
    });
    
    // Start with old data
    map.getSource('dengue-data').setData(oldDengueData);
    
    // Add change indicators
    addDengueChangeIndicators(significantChanges);
    
    // Animate transition
    const startTime = performance.now();
    
    const animateFrame = (currentTime) => {
      const elapsed = currentTime - startTime;
      let linearProgress = Math.min(elapsed / duration, 1);
      
      // Apply easing for more dramatic effect
      const progress = Easing.easeInOutCubic(linearProgress);
      
      // Create blended data for this frame
      const blendedData = createBlendedDengueData(oldDengueData, newDengueData, progress);
      
      // Update source
      map.getSource('dengue-data').setData(blendedData);
      
      // Update dengue circle styles with dramatic effect
      updateDengueCircleStyles(progress);
      
      // Update change indicators
      updateDengueChangeIndicators(progress);
      
      if (linearProgress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        // Clean up when done
        removeDengueChangeIndicators();
      }
    };
    
    // Start animation
    requestAnimationFrame(animateFrame);
  }
  
  // Create blended dengue data for animation
  function createBlendedDengueData(oldData, newData, progress) {
    const blendedData = {
      type: 'FeatureCollection',
      features: []
    };
    
    // Create maps for quick lookup
    const oldFeaturesMap = {};
    const newFeaturesMap = {};
    
    oldData.features.forEach(feature => {
      oldFeaturesMap[feature.properties.municipalityCode] = feature;
    });
    
    newData.features.forEach(feature => {
      newFeaturesMap[feature.properties.municipalityCode] = feature;
    });
    
    // Process all municipalities
    const allMunicipalities = new Set([
      ...Object.keys(oldFeaturesMap),
      ...Object.keys(newFeaturesMap)
    ]);
    
    allMunicipalities.forEach(code => {
      const oldFeature = oldFeaturesMap[code];
      const newFeature = newFeaturesMap[code];
      
      // Case 1: Municipality exists in both years
      if (oldFeature && newFeature) {
        // Create interpolated feature
        const interpolatedFeature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: newFeature.geometry.coordinates
          },
          properties: {
            municipalityCode: code,
            municipalityName: newFeature.properties.municipalityName,
            // Interpolate cases and rate with easing
            dengueCases: Math.round(oldFeature.properties.dengueCases + 
              (newFeature.properties.dengueCases - oldFeature.properties.dengueCases) * progress),
            population: newFeature.properties.population,
            caseRate: oldFeature.properties.caseRate + 
              (newFeature.properties.caseRate - oldFeature.properties.caseRate) * progress,
            // Flag for significant changes
            significantChange: Math.abs(newFeature.properties.dengueCases - oldFeature.properties.dengueCases) > 
              Math.max(10, oldFeature.properties.dengueCases * 0.2)
          }
        };
        blendedData.features.push(interpolatedFeature);
      }
      // Case 2: Municipality only in old year (fading out)
      else if (oldFeature && !newFeature) {
        const fadeOutProgress = 1 - progress;
        if (fadeOutProgress > 0) { // Only include if still visible
          const fadeOutFeature = JSON.parse(JSON.stringify(oldFeature));
          fadeOutFeature.properties.fadeOut = true;
          fadeOutFeature.properties.fadeProgress = fadeOutProgress;
          // Scale down the size as it fades out
          fadeOutFeature.properties.dengueCases = oldFeature.properties.dengueCases * fadeOutProgress;
          blendedData.features.push(fadeOutFeature);
        }
      }
      // Case 3: Municipality only in new year (fading in)
      else if (!oldFeature && newFeature) {
        const fadeInProgress = progress;
        if (fadeInProgress > 0) { // Only include once it starts to be visible
          const fadeInFeature = JSON.parse(JSON.stringify(newFeature));
          fadeInFeature.properties.fadeIn = true;
          fadeInFeature.properties.fadeProgress = fadeInProgress;
          // Scale up the size as it fades in
          fadeInFeature.properties.dengueCases = newFeature.properties.dengueCases * fadeInProgress;
          blendedData.features.push(fadeInFeature);
        }
      }
    });
    
    return blendedData;
  }
  
  // Update dengue circle styles during animation
  function updateDengueCircleStyles(progress) {
    if (!map.getLayer('dengue-circles')) return;
    
    // Add a subtle scale effect during transition
    const scale = 1 + Math.sin(progress * Math.PI) * 0.2; // 0.8 to 1.2x size effect
    
    map.setPaintProperty('dengue-circles', 'circle-radius', [
      'interpolate',
      ['linear'],
      ['get', 'dengueCases'],
      0, 0,
      10, 5 * scale,
      100, 10 * scale,
      1000, 20 * scale,
      10000, 40 * scale
    ]);
    
    // Enhanced opacity effects
    map.setPaintProperty('dengue-circles', 'circle-opacity', [
      'case',
      ['boolean', ['get', 'fadeOut'], false], ['*', ['get', 'fadeProgress'], 0.7],
      ['boolean', ['get', 'fadeIn'], false], ['*', ['get', 'fadeProgress'], 0.7],
      ['boolean', ['get', 'significantChange'], false], 
        ['+', 0.6, ['*', Math.sin(progress * Math.PI * 2) * 0.3, 0.4]], // Pulse for significant changes
      [
        'interpolate',
        ['linear'],
        ['get', 'caseRate'],
        0, 0.3,
        1, 0.4,
        5, 0.6, 
        10, 0.8,
        50, 0.9
      ]
    ]);
    
    // Add halo effect to growing circles
    map.setPaintProperty('dengue-circles', 'circle-stroke-width', [
      'case',
      ['boolean', ['get', 'significantChange'], false], 
        ['+', 1, ['*', Math.sin(progress * Math.PI * 3), 2]],
      1
    ]);
    
    map.setPaintProperty('dengue-circles', 'circle-stroke-color', [
      'case',
      ['boolean', ['get', 'significantChange'], false], 
        'rgba(255, 255, 255, 0.8)',
      '#FFFFFF'
    ]);
  }
  
  // Add visual indicators for municipalities with significant changes
  function addDengueChangeIndicators(changes) {
    // Remove existing indicators
    removeDengueChangeIndicators();
    
    // Create container if it doesn't exist
    let container = document.getElementById('dengue-change-indicators');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dengue-change-indicators';
      document.body.appendChild(container);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        #dengue-change-indicators {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 10;
          pointer-events: none;
        }
        
        .dengue-indicator {
          position: absolute;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          text-shadow: 0 0 3px rgba(0,0,0,0.8);
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
        }
        
        .dengue-indicator.increase {
          background-color: rgba(220, 50, 50, 0.8);
          animation: pulseRed 2s infinite;
        }
        
        .dengue-indicator.decrease {
          background-color: rgba(50, 150, 50, 0.8);
          animation: pulseGreen 2s infinite;
        }
        
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(220, 50, 50, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(220, 50, 50, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 50, 50, 0); }
        }
        
        @keyframes pulseGreen {
          0% { box-shadow: 0 0 0 0 rgba(50, 150, 50, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(50, 150, 50, 0); }
          100% { box-shadow: 0 0 0 0 rgba(50, 150, 50, 0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create indicators for significant changes
    changes.forEach((change, index) => {
      setTimeout(() => {
        const point = map.project(change.coordinates);
        
        const indicator = document.createElement('div');
        indicator.className = `dengue-indicator ${change.increase ? 'increase' : 'decrease'}`;
        indicator.style.left = `${point.x}px`;
        indicator.style.top = `${point.y}px`;
        indicator.style.width = '30px';
        indicator.style.height = '30px';
        indicator.style.fontSize = '16px';
        indicator.textContent = change.increase ? '↑' : '↓';
        indicator.title = `${change.name}: ${change.increase ? 'Increase' : 'Decrease'} in dengue cases`;
        
        container.appendChild(indicator);
        
        // Fade in
        setTimeout(() => {
          indicator.style.opacity = '1';
        }, 10);
      }, index * 100); // Stagger the appearance
    });
    
    // Store references for later use
    window.dengueChangeIndicators = changes;
  }
  
  // Update dengue change indicators during animation
  function updateDengueChangeIndicators(progress) {
    const container = document.getElementById('dengue-change-indicators');
    if (!container) return;
    
    // Scale effect during animation
    const indicators = container.querySelectorAll('.dengue-indicator');
    indicators.forEach(indicator => {
      const scale = 1 + Math.sin(progress * Math.PI) * 0.2; // 0.8 to 1.2x
      indicator.style.transform = `translate(-50%, -50%) scale(${scale})`;
    });
  }
  
  // Remove change indicators
  function removeDengueChangeIndicators() {
    const container = document.getElementById('dengue-change-indicators');
    if (container) {
      container.innerHTML = '';
    }
  }
  
  // 4. Setup enhanced UI controls
  // -----------------------------------------------------------
  function setupEnhancedUIControls() {
    // Get the year slider
    const yearSlider = document.getElementById('yearSlider');
    const currentYearElement = document.getElementById('current-year');
    
    // Enhanced slider interaction
    yearSlider.addEventListener('input', () => {
      const oldYear = currentYear;
      const newYear = parseInt(yearSlider.value, 10);
      
      if (oldYear !== newYear) {
        // Update display
        currentYearElement.textContent = newYear;
        
        // Clear popups
        const popups = document.getElementsByClassName('mapboxgl-popup');
        if (popups.length) {
          Array.from(popups).forEach(popup => popup.remove());
        }
        
        // Update global year
        currentYear = newYear;
        
        // Animate with enhanced transition
        updateMapLayersWithEnhancedTransition(oldYear, newYear);
      }
    });
    
    // Enhanced play button
    const playButton = document.getElementById('playButton');
    let isPlaying = false;
    
    playButton.addEventListener('click', () => {
      if (isPlaying) {
        // Stop animation
        clearInterval(animationTimer);
        animationTimer = null;
        playButton.innerHTML = '<span class="play-icon">▶</span> Play Animation';
        isPlaying = false;
      } else {
        // Start animation
        playButton.innerHTML = '<span class="play-icon">⏸</span> Pause Animation';
        isPlaying = true;
        
        // Reset to beginning if at end
        if (currentYear >= 2019) {
          currentYear = 2007;
          yearSlider.value = currentYear;
          currentYearElement.textContent = currentYear;
          updateMapLayers(); // Initial state
        }
        
        // Add a pulsing effect to the play button
        const originalBackground = playButton.style.backgroundColor;
        playButton.style.transition = 'background-color 0.5s';
        
        const pulseButton = () => {
          playButton.style.backgroundColor = '#2196F3';
          setTimeout(() => {
            playButton.style.backgroundColor = originalBackground;
          }, 300);
        };
        
        // Animate through years with dramatic transitions
        animationTimer = setInterval(() => {
          if (currentYear < 2019) {
            pulseButton(); // Visual pulse effect on button
            
            const oldYear = currentYear;
            currentYear++;
            yearSlider.value = currentYear;
            currentYearElement.textContent = currentYear;
            
            // Clear popups
            const popups = document.getElementsByClassName('mapboxgl-popup');
            if (popups.length) {
              Array.from(popups).forEach(popup => popup.remove());
            }
            
            // Use enhanced transition
            updateMapLayersWithEnhancedTransition(oldYear, currentYear, 1000); // Faster for animation
          } else {
            // Stop at end
            clearInterval(animationTimer);
            animationTimer = null;
            playButton.innerHTML = '<span class="play-icon">▶</span> Play Animation';
            isPlaying = false;
          }
        }, 1500); // Allow 1.5 seconds between transitions
      }
    });
  }
  
  // 5. Initialize and integrate with existing code
  // -----------------------------------------------------------
  
  // Setup map transitions when style is loaded
  map.on('style.load', () => {
    // Add transition properties
    map.setPaintProperty('municipality-fill', 'fill-color-transition', {
      duration: 1000,
      delay: 0
    });
    
    map.setPaintProperty('municipality-outline', 'line-color-transition', {
      duration: 1000,
      delay: 0
    });
    
    // Setup enhanced controls
    setupEnhancedUIControls();
  });
  
  // Function to initialize everything
  function enhanceMapAnimations() {
    console.log("Enhancing map animations with dramatic visual effects");
    
    // Setup enhanced controls if map is loaded
    if (mapLoaded) {
      setupEnhancedUIControls();
    }
    
    // Store original functions for reference
    window.originalUpdateMapLayers = updateMapLayers;
    window.originalUpdateDengueOverlay = updateDengueOverlay;
  }
  
  // Initialize when document is ready
  if (document.readyState === 'complete') {
    enhanceMapAnimations();
  } else {
    window.addEventListener('load', enhanceMapAnimations);
  }