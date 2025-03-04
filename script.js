// Replace with your own Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2hhaGVlcjI0IiwiYSI6ImNtN3RwbWF3YjF1Z28yanB3ZGFqeXFtNnUifQ.2Vh8Gcb9JQwm_sD_FcMoqw';

// Global variables
let municipalitiesData = {}; // Will store CSV data
let geojsonData = null; // Will store the GeoJSON data
let currentYear = 2019;
let dengueOverlayVisible = false;
let showComponentsVisible = false;
let hoveredMunicipalityId = null;
let mapLoaded = false;
let csvLoaded = false;
let geojsonLoaded = false;

// Initialize the map with Colombia centered
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-74.297, 4.571], // Colombia center
  zoom: 5
});

// Show loading message
function showLoadingMessage(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-message';
  loadingDiv.style.position = 'absolute';
  loadingDiv.style.top = '50%';
  loadingDiv.style.left = '50%';
  loadingDiv.style.transform = 'translate(-50%, -50%)';
  loadingDiv.style.padding = '20px';
  loadingDiv.style.background = 'rgba(255, 255, 255, 0.9)';
  loadingDiv.style.borderRadius = '5px';
  loadingDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  loadingDiv.style.zIndex = '1000';
  loadingDiv.innerHTML = `<strong>${message}</strong><br><small>This may take a moment...</small>`;
  document.body.appendChild(loadingDiv);
}

// Hide loading message
function hideLoadingMessage() {
  const loadingDiv = document.getElementById('loading-message');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// Initialize the application
async function initApp() {
  showLoadingMessage('Loading map and data...');
  
  try {
    // Set up map load event first
    map.on('load', () => {
      console.log("Map base loaded");
      mapLoaded = true;
      attemptRenderMap();
    });

    // 1. Load CSV data
    await loadCSVData();
    csvLoaded = true;
    
    // 2. Set up UI controls
    setupUIControls();

    // 3. Load JSON Map in parallel
    loadColumbiaMap().then(() => {
      geojsonLoaded = true;
      attemptRenderMap();
    }).catch(error => {
      console.error("Columbia map load error:", error);
      alert(`Error loading map data: ${error.message}. Check console for details.`);
      hideLoadingMessage();
    });
  } catch (error) {
    console.error('Error initializing application:', error);
    alert('There was an error loading the application. Please check the console for details.');
    hideLoadingMessage();
  }
}

// Attempt to render map when all resources are ready
function attemptRenderMap() {
  if (mapLoaded && csvLoaded && geojsonLoaded) {
    console.log("All resources loaded, rendering map");
    renderMap();
    hideLoadingMessage();
  } else {
    console.log(`Waiting for resources - Map: ${mapLoaded}, CSV: ${csvLoaded}, GeoJSON: ${geojsonLoaded}`);
  }
}

// Render the map once all resources are loaded
function renderMap() {
  try {
    // Add the source if it doesn't exist
    if (!map.getSource('municipalities')) {
      map.addSource('municipalities', {
        type: 'geojson',
        data: geojsonData
      });
      
      // Add municipality fill layer showing vulnerability
      map.addLayer({
        id: 'municipality-fill',
        type: 'fill',
        source: 'municipalities',
        paint: {
          'fill-color': [
            'case',
            ['<', ['get', 'vulnerabilityIndex'], 0], '#cccccc', // Gray for no data
            ['interpolate',
              ['linear'],
              ['get', 'vulnerabilityIndex'],
              0, '#22c55e',  // Green for low vulnerability
              50, '#eab308', // Yellow for medium vulnerability
              100, '#ef4444' // Red for high vulnerability
            ]
          ],
          'fill-opacity': 0.7
        }
      });
      
      // Add outline layer for hover effect
      map.addLayer({
        id: 'municipality-outline',
        type: 'line',
        source: 'municipalities',
        paint: {
          'line-color': '#000000',
          'line-width': 1,
          'line-opacity': 0.3
        }
      });
      
      // Add highlight layer that will be filtered to show only hovered municipality
      map.addLayer({
        id: 'municipality-highlight',
        type: 'line',
        source: 'municipalities',
        paint: {
          'line-color': '#FFFF00',
          'line-width': 2,
          'line-opacity': 1
        },
        filter: ['==', ['get', 'id'], ''] // Empty filter initially
      });
      
      // Set up map interactions once layers are added
      setupMapInteractions();
    }
    
    // Update map layers with vulnerability data
    updateMapLayers();
    
    // Focus the map on the data
    fitMapToData();
    
    console.log('Map rendered successfully');
  } catch (error) {
    console.error('Error rendering map:', error);
    alert(`Error rendering map: ${error.message}`);
  }
}

// Load CSV data with municipality information
async function loadCSVData() {
  try {
    console.log("Attempting to load CSV data...");
    // Try different relative paths that might work on GitHub Pages
    const possiblePaths = ['metadata.csv', './metadata.csv', '/metadata.csv'];
    let response = null;
    let success = false;
    
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to fetch CSV from: ${path}`);
        response = await fetch(path);
        if (response.ok) {
          success = true;
          console.log(`Successfully loaded CSV from: ${path}`);
          break;
        }
      } catch (e) {
        console.log(`Failed to fetch from ${path}:`, e.message);
      }
    }
    
    if (!success) {
      throw new Error(`Failed to load CSV: ${response ? response.status : 'all paths failed'}`);
    }
    
    const csvText = await response.text();
    console.log(`CSV loaded (${csvText.length} bytes), parsing...`);

    // Parse CSV using PapaParse
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Process the data
        results.data.forEach(row => {
          if (!row['Municipality code'] || !row.Municipality) return;
          
          const code = row['Municipality code'].toString();
          
          if (!municipalitiesData[code]) {
            municipalitiesData[code] = {};
          }
          
          // Extract population and socioeconomic data for each year
          for (let year = 2007; year <= 2019; year++) {
            if (row[`Population${year}`] > 0) {
              municipalitiesData[code][year] = {
                name: row.Municipality,
                population: row[`Population${year}`],
                waterAccess: row['Householdswithoutwateraccess(%)'],
                education: row['Secondary/HigherEducation(%)'],
                employment: row['Employedpopulation(%)'],
                dengueCases: row[`Cases${year}`] || 0,
              };
            }
          }
        });
        
        console.log(`CSV data loaded successfully (${Object.keys(municipalitiesData).length} municipalities)`);
      },
      error: (error) => {
        throw new Error('Error parsing CSV: ' + error.message);
      }
    });
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}

// Load Columbia Map JSON
async function loadColumbiaMap() {
  try {
    console.log("Attempting to load Columbia Map...");
    // Try different relative paths that might work on GitHub Pages
    const possiblePaths = [
      'columbiaMap.json', 
      './columbiaMap.json', 
      '/columbiaMap.json'
    ];
    
    let response = null;
    let success = false;
    
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to fetch Columbia Map from: ${path}`);
        response = await fetch(path);
        if (response.ok) {
          success = true;
          console.log(`Successfully loaded Columbia Map from: ${path}`);
          break;
        }
      } catch (e) {
        console.log(`Failed to fetch from ${path}:`, e.message);
      }
    }
    
    if (!success) {
      throw new Error(`Failed to load Columbia Map: ${response ? response.status : 'all paths failed'}`);
    }
    
    // Parse the JSON data
    let mapData = await response.json();
    
    // Log the structure of the JSON for debugging
    console.log("Columbia Map loaded - analyzing structure:");
    
    // Check if it's already in GeoJSON format or needs conversion
    if (mapData.type === 'FeatureCollection' && Array.isArray(mapData.features)) {
      console.log("Columbia Map is in GeoJSON format");
      
      // Process GeoJSON features to ensure they have the required properties
      mapData.features = mapData.features.map((feature, index) => {
        // Ensure each feature has an ID
        if (!feature.id) {
          feature.id = `municipality-${index}`;
        }
        
        // Ensure each feature has properties
        if (!feature.properties) {
          feature.properties = {};
        }
        
        return feature;
      });
      
      geojsonData = mapData;
    } else {
      console.log("Columbia Map is not in standard GeoJSON format, attempting conversion");
      // If it's not in GeoJSON format, we need to convert it
      geojsonData = convertToGeoJSON(mapData);
    }
    
    if (geojsonData.features && geojsonData.features.length > 0) {
      const sample = geojsonData.features[0];
      console.log(`Found ${geojsonData.features.length} features in the map`);
      console.log("First feature properties:", Object.keys(sample.properties));
      
      if (sample.geometry && sample.geometry.coordinates) {
        console.log("First feature geometry type:", sample.geometry.type);
        if (sample.geometry.coordinates.length > 0) {
          // Print a snippet of the coordinates
          const coordSample = JSON.stringify(sample.geometry.coordinates).substring(0, 100);
          console.log(`Coordinate sample: ${coordSample}...`);
        }
      }
    }
    
    return geojsonData;
  } catch (error) {
    console.error('Error loading Columbia Map:', error);
    throw error;
  }
}

// Convert non-GeoJSON data to GeoJSON format if needed
function convertToGeoJSON(data) {
  // This is a placeholder function that you may need to customize
  // based on the actual structure of your columbiaMap.json
  
  console.log("Converting data to GeoJSON format");
  
  // Create a basic GeoJSON structure
  const geojson = {
    type: "FeatureCollection",
    features: []
  };
  
  // Logic to convert the specific format of your JSON to GeoJSON
  // This will depend on the structure of your columbiaMap.json
  
  // Example conversion (you will need to adjust this):
  if (Array.isArray(data)) {
    // If data is an array of objects, convert each to a feature
    geojson.features = data.map((item, index) => {
      return {
        type: "Feature",
        id: `municipality-${index}`,
        properties: {
          // Copy all properties from the item
          ...item.properties || item,
          // Add any additional properties needed
          name: item.name || item.properties?.name || `Municipality ${index}`
        },
        geometry: item.geometry || { 
          // Default geometry if not provided
          type: "Polygon",
          coordinates: item.coordinates || []
        }
      };
    });
  } else if (data.municipalities || data.regions || data.areas) {
    // If data has a collection of municipalities under a specific key
    const municipalities = data.municipalities || data.regions || data.areas || [];
    
    geojson.features = municipalities.map((item, index) => {
      return {
        type: "Feature",
        id: item.id || `municipality-${index}`,
        properties: {
          // Copy all properties
          ...item.properties || item,
          name: item.name || item.properties?.name || `Municipality ${index}`
        },
        geometry: item.geometry || {
          type: "Polygon",
          coordinates: item.coordinates || []
        }
      };
    });
  }
  
  console.log(`Converted to GeoJSON with ${geojson.features.length} features`);
  return geojson;
}

// Calculate bounding box for GeoJSON data
function getBoundingBox(geojson) {
  let bounds = {
    minLng: 180, maxLng: -180,
    minLat: 90, maxLat: -90
  };
  
  if (!geojson.features) return bounds;
  
  geojson.features.forEach(feature => {
    if (!feature.geometry) return;
    
    const processCoordinates = (coords) => {
      // For a single point
      if (!Array.isArray(coords[0])) {
        const [lng, lat] = coords;
        bounds.minLng = Math.min(bounds.minLng, lng);
        bounds.maxLng = Math.max(bounds.maxLng, lng);
        bounds.minLat = Math.min(bounds.minLat, lat);
        bounds.maxLat = Math.max(bounds.maxLat, lat);
        return;
      }
      
      // For arrays of coordinates
      coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
          processCoordinates(coord);
        } else {
          const [lng, lat] = coord;
          bounds.minLng = Math.min(bounds.minLng, lng);
          bounds.maxLng = Math.max(bounds.maxLng, lng);
          bounds.minLat = Math.min(bounds.minLat, lat);
          bounds.maxLat = Math.max(bounds.maxLat, lat);
        }
      });
    };
    
    processCoordinates(feature.geometry.coordinates);
  });
  
  return bounds;
}

// Fit map view to GeoJSON data
function fitMapToData() {
  if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
    // Fallback to Colombia bounds
    map.fitBounds([[-79, -4], [-67, 12]], { padding: 20 });
    return;
  }
  
  try {
    const bounds = getBoundingBox(geojsonData);
    
    // Check if bounds are valid
    if (bounds.minLng < bounds.maxLng && bounds.minLat < bounds.maxLat) {
      map.fitBounds([
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat]
      ], { 
        padding: 20,
        maxZoom: 7
      });
      
      console.log("Map fitted to data bounds:", [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat]
      ]);
    } else {
      console.warn("Invalid bounds calculated, using default Colombia bounds");
      map.fitBounds([[-79, -4], [-67, 12]], { padding: 20 });
    }
  } catch (error) {
    console.error("Error fitting map to data:", error);
    // Fallback to Colombia coordinates
    map.flyTo({
      center: [-74.297, 4.571],
      zoom: 5
    });
  }
}

// Set up map interactions (hover, click)
function setupMapInteractions() {
  // Change cursor and handle hovering
  map.on('mousemove', 'municipality-fill', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    
    if (e.features.length > 0) {
      const feature = e.features[0];
      
      // If this is the first hover, log properties to help debugging
      if (!hoveredMunicipalityId) {
        console.log("Feature properties available:", Object.keys(feature.properties));
        console.log("Feature ID:", feature.id);
      }
      
      // Try to find a property that might match with the municipality code in CSV
      const properties = feature.properties;
      
      // Possible property names in the JSON file that might contain municipality codes
      const possibleCodeProperties = [
        'code', 'id', 'municipality_code', 'MPIO_CDPMP', 'CODIGO_MPI', 
        'COD_DANE', 'DPTO_CCDGO', 'municipalityCode', 'dpt'
      ];
      
      // Try to find a matching property
      let municipalityCode = feature.id;
      
      for (const prop of possibleCodeProperties) {
        if (properties[prop]) {
          municipalityCode = properties[prop].toString();
          break;
        }
      }
      
      // If we can't find a matching property, try using the name to match
      if (!municipalityCode && properties.name) {
        // Find a municipality in our CSV data with matching name
        for (const [code, yearData] of Object.entries(municipalitiesData)) {
          if (yearData[currentYear] && 
              yearData[currentYear].name.toLowerCase() === properties.name.toLowerCase()) {
            municipalityCode = code;
            break;
          }
        }
      }
      
      if (hoveredMunicipalityId !== municipalityCode) {
        hoveredMunicipalityId = municipalityCode;
        
        // Update highlight layer to show only this municipality
        map.setFilter('municipality-highlight', ['==', ['id'], municipalityCode]);
        
        // Show municipality info in the sidebar
        showMunicipalityInfo(municipalityCode);
      }
    }
  });
  
  // Reset on mouse leave
  map.on('mouseleave', 'municipality-fill', () => {
    map.getCanvas().style.cursor = '';
    hoveredMunicipalityId = null;
    
    // Clear highlight
    map.setFilter('municipality-highlight', ['==', ['id'], '']);
    
    // Hide municipality info
    hideMunicipalityInfo();
  });
  
  // Handle click to show popup
  map.on('click', 'municipality-fill', (e) => {
    if (e.features.length > 0) {
      const feature = e.features[0];
      const properties = feature.properties;
      
      // Same logic as hover to find municipality code
      const possibleCodeProperties = [
        'code', 'id', 'municipality_code', 'MPIO_CDPMP', 'CODIGO_MPI', 
        'COD_DANE', 'DPTO_CCDGO', 'municipalityCode', 'dpt'
      ];
      
      let municipalityCode = feature.id;
      
      for (const prop of possibleCodeProperties) {
        if (properties[prop]) {
          municipalityCode = properties[prop].toString();
          break;
        }
      }
      
      if (!municipalityCode && properties.name) {
        for (const [code, yearData] of Object.entries(municipalitiesData)) {
          if (yearData[currentYear] && 
              yearData[currentYear].name.toLowerCase() === properties.name.toLowerCase()) {
            municipalityCode = code;
            break;
          }
        }
      }
      
      // Get vulnerability data
      const vulnerability = computeVulnerabilityIndex(municipalityCode, currentYear);
      const municipalityData = getMunicipalityData(municipalityCode, currentYear);
      
      if (vulnerability && municipalityData) {
        // Create popup content
        const popupContent = `
          <div class="popup-content">
            <div class="popup-title">${municipalityData.name}</div>
            <div>Population: ${municipalityData.population.toLocaleString()}</div>
            <div>Vulnerability Index: ${vulnerability.index.toFixed(1)}%</div>
            ${showComponentsVisible ? `
              <div class="popup-component">
                <span>Water Access:</span>
                <span>${vulnerability.water.toFixed(1)}%</span>
              </div>
              <div class="popup-component">
                <span>Education:</span>
                <span>${vulnerability.education.toFixed(1)}%</span>
              </div>
              <div class="popup-component">
                <span>Employment:</span>
                <span>${vulnerability.employment.toFixed(1)}%</span>
              </div>
            ` : ''}
            ${dengueOverlayVisible ? `
              <div class="popup-component">
                <span>Dengue Cases:</span>
                <span>${municipalityData.dengueCases.toLocaleString()}</span>
              </div>
            ` : ''}
          </div>
        `;
        
        // Show popup
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(map);
      } else {
        // Show popup with just the feature properties if we don't have vulnerability data
        const name = properties.name || properties.NAME || properties.NOMBRE || 'Unknown';
        
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="popup-content">
              <div class="popup-title">${name}</div>
              <div>No vulnerability data available</div>
            </div>
          `)
          .addTo(map);
      }
    }
  });
}

// Set up UI controls (slider, checkboxes)
function setupUIControls() {
  // Year slider
  const yearSlider = document.getElementById('yearSlider');
  const currentYearElement = document.getElementById('current-year');
  
  yearSlider.addEventListener('input', () => {
    currentYear = parseInt(yearSlider.value, 10);
    currentYearElement.textContent = currentYear;
    updateMapLayers();
  });
  
  // Dengue overlay checkbox
  const dengueCheckbox = document.getElementById('dengueOverlay');
  dengueCheckbox.addEventListener('change', (e) => {
    dengueOverlayVisible = e.target.checked;
    
    if (dengueOverlayVisible) {
      addDengueOverlay();
    } else {
      removeDengueOverlay();
    }
  });
  
  // Components checkbox
  const componentsCheckbox = document.getElementById('showComponents');
  componentsCheckbox.addEventListener('change', (e) => {
    showComponentsVisible = e.target.checked;
    
    if (showComponentsVisible) {
      document.getElementById('component-breakdown').style.display = 'block';
    } else {
      document.getElementById('component-breakdown').style.display = 'none';
    }
  });
}

// Update map layers with current year data
function updateMapLayers() {
  if (!map.getSource('municipalities') || !geojsonData) return;
  
  // Clone the GeoJSON data
  const updatedData = JSON.parse(JSON.stringify(geojsonData));
  
  // Update properties with vulnerability index
  updatedData.features = updatedData.features.map(feature => {
    // Determine municipality code as in hover and click handlers
    const properties = feature.properties;
    
    const possibleCodeProperties = [
      'code', 'id', 'municipality_code', 'MPIO_CDPMP', 'CODIGO_MPI', 
      'COD_DANE', 'DPTO_CCDGO', 'municipalityCode', 'dpt'
    ];
    
    let municipalityCode = feature.id;
    
    for (const prop of possibleCodeProperties) {
      if (properties[prop]) {
        municipalityCode = properties[prop].toString();
        break;
      }
    }
    
    if (!municipalityCode && properties.name) {
      for (const [code, yearData] of Object.entries(municipalitiesData)) {
        if (yearData[currentYear] && 
            yearData[currentYear].name.toLowerCase() === properties.name.toLowerCase()) {
          municipalityCode = code;
          break;
        }
      }
    }
    
    // Calculate vulnerability
    const vulnerability = computeVulnerabilityIndex(municipalityCode, currentYear);
    
    if (vulnerability) {
      feature.properties.vulnerabilityIndex = vulnerability.index;
      feature.properties.waterVulnerability = vulnerability.water;
      feature.properties.educationVulnerability = vulnerability.education;
      feature.properties.employmentVulnerability = vulnerability.employment;
    } else {
      feature.properties.vulnerabilityIndex = -1; // No data
    }
    
    return feature;
  });
  
  // Update the source
  map.getSource('municipalities').setData(updatedData);
  
  // Update dengue overlay if visible
  if (dengueOverlayVisible) {
    updateDengueOverlay();
  }
}

// Compute vulnerability index and components for a municipality
function computeVulnerabilityIndex(municipalityCode, year) {
  const data = getMunicipalityData(municipalityCode, year);
  if (!data) return null;
  
  // Normalize factors (0-100 scale, higher = more vulnerable)
  const waterVulnerability = data.waterAccess;
  const educationVulnerability = 100 - data.education;
  const employmentVulnerability = 100 - data.employment;
  
  // Equal weighting (can be adjusted based on domain knowledge)
  const vulnerabilityIndex = (waterVulnerability + educationVulnerability + employmentVulnerability) / 3;
  
  return {
    index: vulnerabilityIndex,
    water: waterVulnerability,
    education: educationVulnerability,
    employment: employmentVulnerability
  };
}

// Get municipality data for a specific year
function getMunicipalityData(municipalityCode, year) {
  if (!municipalityCode) return null;
  return municipalitiesData[municipalityCode]?.[year] || null;
}

// Add dengue overlay layer
function addDengueOverlay() {
  // Remove existing layer if it exists
  if (map.getLayer('dengue-circles')) {
    map.removeLayer('dengue-circles');
  }
  
  // Add new layer
  map.addLayer({
    id: 'dengue-circles',
    type: 'circle',
    source: 'municipalities',
    paint: {
      'circle-color': '#B91C1C',
      'circle-opacity': 0.7,
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'dengueCases'],
        0, 0,
        10, 5,
        100, 10,
        1000, 20,
        10000, 40
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FFFFFF'
    }
  });
  
  // Update the dengue data
  updateDengueOverlay();
}

// Remove dengue overlay
function removeDengueOverlay() {
  if (map.getLayer('dengue-circles')) {
    map.removeLayer('dengue-circles');
  }
}

// Update dengue overlay with current year data
function updateDengueOverlay() {
  if (!map.getSource('municipalities') || !geojsonData) return;
  
  // Clone the GeoJSON data
  const updatedData = JSON.parse(JSON.stringify(geojsonData));
  
  // Update properties with dengue cases using the same municipality code lookup
  updatedData.features = updatedData.features.map(feature => {
    const properties = feature.properties;
    
    const possibleCodeProperties = [
      'code', 'id', 'municipality_code', 'MPIO_CDPMP', 'CODIGO_MPI', 
      'COD_DANE', 'DPTO_CCDGO', 'municipalityCode', 'dpt'
    ];
    
    let municipalityCode = feature.id;
    
    for (const prop of possibleCodeProperties) {
      if (properties[prop]) {
        municipalityCode = properties[prop].toString();
        break;
      }
    }
    
    if (!municipalityCode && properties.name) {
      for (const [code, yearData] of Object.entries(municipalitiesData)) {
        if (yearData[currentYear] && 
            yearData[currentYear].name.toLowerCase() === properties.name.toLowerCase()) {
          municipalityCode = code;
          break;
        }
      }
    }
    
    const data = getMunicipalityData(municipalityCode, currentYear);
    
    feature.properties.dengueCases = data ? data.dengueCases : 0;
    
    return feature;
  });
  
  // Update the source
  map.getSource('municipalities').setData(updatedData);
}

// Show municipality information in the panel
function showMunicipalityInfo(municipalityCode) {
  const infoMessage = document.querySelector('.info-message');
  const detailsContainer = document.getElementById('municipality-details');
  
  const data = getMunicipalityData(municipalityCode, currentYear);
  const vulnerability = computeVulnerabilityIndex(municipalityCode, currentYear);
  
  if (data && vulnerability) {
    // Update info panel content
    document.getElementById('municipality-name').textContent = data.name;
    document.getElementById('municipality-population').textContent = data.population.toLocaleString();
    document.getElementById('vulnerability-score').textContent = `${vulnerability.index.toFixed(1)}%`;
    document.getElementById('water-score').textContent = `${vulnerability.water.toFixed(1)}%`;
    document.getElementById('education-score').textContent = `${vulnerability.education.toFixed(1)}%`;
    document.getElementById('employment-score').textContent = `${vulnerability.employment.toFixed(1)}%`;
    
    // Show components if option is selected
    if (showComponentsVisible) {
      document.getElementById('component-breakdown').style.display = 'block';
    } else {
      document.getElementById('component-breakdown').style.display = 'none';
    }
    
    // Show details and hide message
    infoMessage.style.display = 'none';
    detailsContainer.style.display = 'block';
    
    // Update vulnerability bar indicator
    updateVulnerabilityBarIndicator(vulnerability.index);
  } else {
    // Show message if no data available
    infoMessage.textContent = 'No data available for this municipality';
    infoMessage.style.display = 'block';
    detailsContainer.style.display = 'none';
    
    // Hide vulnerability bar indicator
    document.getElementById('bar-indicator').style.display = 'none';
  }
}

// Hide municipality information
function hideMunicipalityInfo() {
  document.querySelector('.info-message').style.display = 'block';
  document.getElementById('municipality-details').style.display = 'none';
  document.getElementById('bar-indicator').style.display = 'none';
}

// Update vulnerability bar indicator position
function updateVulnerabilityBarIndicator(vulnerabilityValue) {
  const indicator = document.getElementById('bar-indicator');
  const barElement = document.getElementById('vulnerability-bar');
  
  // Show the indicator
  indicator.style.display = 'flex';
  
  // Calculate position (invert percentage since bar goes from bottom to top)
  const barHeight = barElement.offsetHeight;
  const pixelOffset = barHeight - (vulnerabilityValue / 100) * barHeight;
  
  // Position the indicator
  indicator.style.top = `${pixelOffset}px`;
  
  // Update the text
  document.getElementById('bar-indicator-value').textContent = `${vulnerabilityValue.toFixed(1)}%`;
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);