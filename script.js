// Replace with your own Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2hhaGVlcjI0IiwiYSI6ImNtN3RwbWF3YjF1Z28yanB3ZGFqeXFtNnUifQ.2Vh8Gcb9JQwm_sD_FcMoqw';

// Global variables
let municipalitiesData = {}; // Will store CSV data
let geojsonData = null; // Will store the GeoJSON data
let currentYear = 2019;
let dengueOverlayVisible = false;
let showComponentsVisible = false;
let hoveredMunicipalityId = null;

// Initialize the map with Colombia centered
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-74.297, 4.571], // Colombia center
  zoom: 5
});

// Initialize the application
async function initApp() {
  try {
    // 1. Load CSV data
    await loadCSVData();
    
    // 2. Set up UI controls
    setupUIControls();

    // 3. Initialize map when it's loaded
    map.on('load', async () => {
      // Load and add custom GeoJSON
      await loadGeoJSON();
    });
  } catch (error) {
    console.error('Error initializing application:', error);
    alert('There was an error loading the application. Please check the console for details.');
  }
}

// Load CSV data with municipality information
async function loadCSVData() {
  try {
    const response = await fetch('metadata.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log("CSV loaded, processing data...");

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

// Load GeoJSON with municipality boundaries
async function loadGeoJSON() {
  try {
    // Always fetch a new copy to avoid caching
    const response = await fetch('municipios_GeoJSON.geojson');
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON: ${response.status} ${response.statusText}`);
    }
    
    // Use let instead of const so we can reassign it
    let data = await response.json();
    
    // Log the structure of the GeoJSON for debugging
    console.log("GeoJSON loaded - structure analysis:");
    console.log(`Type: ${data.type}, Features: ${data.features ? data.features.length : 0}`);
    
    if (data.features && data.features.length > 0) {
      const sample = data.features[0];
      console.log("First feature properties:", Object.keys(sample.properties));
      console.log("First feature ID:", sample.id);
      console.log("Geometry type:", sample.geometry.type);
      
      // Get bounding box of the data to check position
      const bounds = getBoundingBox(data);
      console.log("Data bounds:", bounds);
      
      // Check if bounds are in a reasonable range for Colombia
      const isInColombia = 
        bounds.minLng > -85 && bounds.maxLng < -60 && 
        bounds.minLat > -5 && bounds.maxLat < 15;
      
      console.log("Data appears to be in Colombia region:", isInColombia);
      
      if (!isInColombia) {
        console.log("Data appears to be outside Colombia region, will transform");
        data = transformGeoJSONToColombiaRegion(data);
      }
    }
    
    // Store the processed GeoJSON
    geojsonData = data;
    
    // Add our custom GeoJSON source if it doesn't already exist
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
    } else {
      // Just update the data if source already exists
      map.getSource('municipalities').setData(geojsonData);
    }
    
    // Update map layers with vulnerability data
    updateMapLayers();
    
    // Focus the map on the data
    fitMapToData();
    
    console.log('GeoJSON data loaded and displayed successfully');
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    alert(`Error loading municipality boundaries: ${error.message}`);
  }
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

// Transform GeoJSON to be in Colombia's region if it's not
function transformGeoJSONToColombiaRegion(geojson) {
  console.log("Transforming GeoJSON to Colombia region");
  
  // Deep clone to avoid modifying the original
  const transformedGeoJSON = JSON.parse(JSON.stringify(geojson));
  
  // Calculate current bounds
  const currentBounds = getBoundingBox(geojson);
  
  // Target bounds for Colombia (approximate)
  const targetBounds = {
    minLng: -79, maxLng: -67,
    minLat: -4, maxLat: 12
  };
  
  // Apply transformation to each feature
  transformedGeoJSON.features.forEach((feature, index) => {
    // Ensure each feature has an ID
    if (!feature.id) {
      feature.id = `municipality-${index}`;
    }
    
    if (feature.geometry && feature.geometry.coordinates) {
      feature.geometry.coordinates = transformCoordinates(
        feature.geometry.coordinates, 
        feature.geometry.type,
        currentBounds,
        targetBounds
      );
    }
  });
  
  console.log("GeoJSON transformation complete");
  return transformedGeoJSON;
}

// Transform coordinates from source bounds to target bounds
function transformCoordinates(coordinates, geometryType, sourceBounds, targetBounds) {
  // Function to transform a single coordinate
  const transformPoint = (coord) => {
    if (!Array.isArray(coord)) return coord;
    
    const [lng, lat] = coord;
    
    // Normalize to 0-1 range based on source bounds
    const normalizedLng = (lng - sourceBounds.minLng) / (sourceBounds.maxLng - sourceBounds.minLng);
    const normalizedLat = (lat - sourceBounds.minLat) / (sourceBounds.maxLat - sourceBounds.minLat);
    
    // Scale to target range
    const newLng = targetBounds.minLng + normalizedLng * (targetBounds.maxLng - targetBounds.minLng);
    const newLat = targetBounds.minLat + normalizedLat * (targetBounds.maxLat - targetBounds.minLat);
    
    return [newLng, newLat];
  };
  
  // Handle different geometry types
  if (geometryType === 'Point') {
    return transformPoint(coordinates);
  } else if (geometryType === 'LineString' || geometryType === 'MultiPoint') {
    return coordinates.map(transformPoint);
  } else if (geometryType === 'Polygon' || geometryType === 'MultiLineString') {
    return coordinates.map(ring => ring.map(transformPoint));
  } else if (geometryType === 'MultiPolygon') {
    return coordinates.map(polygon => polygon.map(ring => ring.map(transformPoint)));
  }
  
  // For nested arrays, recursively transform
  return coordinates.map(coord => {
    if (Array.isArray(coord[0])) {
      return transformCoordinates(coord, null, sourceBounds, targetBounds);
    }
    return transformPoint(coord);
  });
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
      
      // Try various property names that might contain municipality code
      const properties = feature.properties;
      const municipalityCode = feature.id || 
        (properties.DPTO_CCDGO && properties.DPTO_CCDGO.toString()) ||
        (properties.MPIO_CDPMP && properties.MPIO_CDPMP.toString()) ||
        (properties.CODIGO_MPI && properties.CODIGO_MPI.toString()) ||
        (properties.COD_DANE && properties.COD_DANE.toString()) ||
        (properties.id && properties.id.toString()) ||
        (properties.dpt && properties.dpt.toString());
      
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
      
      // Find municipality code
      const municipalityCode = feature.id || 
        (properties.DPTO_CCDGO && properties.DPTO_CCDGO.toString()) ||
        (properties.MPIO_CDPMP && properties.MPIO_CDPMP.toString()) ||
        (properties.CODIGO_MPI && properties.CODIGO_MPI.toString()) ||
        (properties.COD_DANE && properties.COD_DANE.toString()) ||
        (properties.id && properties.id.toString()) ||
        (properties.dpt && properties.dpt.toString());
      
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
    // Determine municipality code
    const properties = feature.properties;
    const municipalityCode = feature.id || 
      (properties.DPTO_CCDGO && properties.DPTO_CCDGO.toString()) ||
      (properties.MPIO_CDPMP && properties.MPIO_CDPMP.toString()) ||
      (properties.CODIGO_MPI && properties.CODIGO_MPI.toString()) ||
      (properties.COD_DANE && properties.COD_DANE.toString()) ||
      (properties.id && properties.id.toString()) ||
      (properties.dpt && properties.dpt.toString());
    
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
  
  // Update properties with dengue cases
  updatedData.features = updatedData.features.map(feature => {
    const properties = feature.properties;
    const municipalityCode = feature.id || 
      (properties.DPTO_CCDGO && properties.DPTO_CCDGO.toString()) ||
      (properties.MPIO_CDPMP && properties.MPIO_CDPMP.toString()) ||
      (properties.CODIGO_MPI && properties.CODIGO_MPI.toString()) ||
      (properties.COD_DANE && properties.COD_DANE.toString()) ||
      (properties.id && properties.id.toString()) ||
      (properties.dpt && properties.dpt.toString());
    
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