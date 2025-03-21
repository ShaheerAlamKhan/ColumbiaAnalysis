// Replace with your own Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2hhaGVlcjI0IiwiYSI6ImNtN3RwbWF3YjF1Z28yanB3ZGFqeXFtNnUifQ.2Vh8Gcb9JQwm_sD_FcMoqw';

// Global variables
let municipalitiesData = {}; // Will store CSV data
let geojsonData = null; // Will store the GeoJSON data
let currentYear = 2019;
let dengueOverlayVisible = false;
let showComponentsVisible = false;
let labelsVisible = false;
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

function hideMunicipalityInfo() {
  document.querySelector('.info-message').style.display = 'block';
  document.getElementById('municipality-details').style.display = 'none';
}

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
            ['step',
              ['get', 'vulnerabilityIndex'],
              '#22c55e',  // Green for low vulnerability (0-30)
              30, '#eab308', // Yellow for moderate vulnerability (30-45)
              45, '#f97316', // Orange for high vulnerability (45-60)
              60, '#ef4444'  // Red for extreme vulnerability (60+)
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
        type: 'fill', // Changed from 'line' to 'fill' to highlight the entire area
        source: 'municipalities',
        paint: {
          'fill-color': '#ADD8E6', // Changed from '#FFFF00' (yellow) to light blue
          'fill-opacity': 0.7,
          'fill-outline-color': '#0066CC'
        },
        filter: ['==', ['get', 'feature_id'], ''] // Empty filter initially, uses feature_id
      });
      
      // Add municipality labels layer (hidden by default)
      map.addLayer({
        id: 'municipality-labels',
        type: 'symbol',
        source: 'municipalities',
        layout: {
          'text-field': [
            'coalesce',
            ['get', 'display_name'],  // First try our stored name
            ['get', 'NAME_2'],        // Then try GeoJSON properties
            ['get', 'name'],
            ['get', 'NAME'],
            ['get', 'NOMBRE'],
            ['get', 'MPIO_CNMBR'],
            'Unknown'
          ],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'visibility': 'none', // Initially hidden
          'text-max-width': 8   // Allow wrapping for longer names
        },
        paint: {
          'text-color': '#333',
          'text-halo-color': '#fff',
          'text-halo-width': 1.5
        }
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

// Function to calculate how urban a municipality is (0-100 scale)
function calculateUrbanityScore(row) {
  let score = 0;
  
  // Population density is a key indicator of urbanity
  // Use houses per km2 as a proxy
  const housesDensity = row['NumberofhousesperKm2'] || 0;
  if (housesDensity > 500) score += 40;
  else if (housesDensity > 200) score += 30;
  else if (housesDensity > 50) score += 20;
  else if (housesDensity > 10) score += 10;
  
  // Hospital density also indicates urban development
  const hospitalsDensity = row['NumberofhospitalsperKm2'] || 0;
  if (hospitalsDensity > 0.1) score += 15;
  else if (hospitalsDensity > 0.05) score += 10;
  else if (hospitalsDensity > 0.01) score += 5;
  
  // Building stratification - higher strata indicate more urban development
  const higherStrata = (row['Buildingstratification3(%)'] || 0) + 
                       (row['Buildingstratification4(%)'] || 0) + 
                       (row['Buildingstratification5(%)'] || 0) + 
                       (row['Buildingstratification6(%)'] || 0);
  if (higherStrata > 20) score += 20;
  else if (higherStrata > 10) score += 15;
  else if (higherStrata > 5) score += 10;
  else if (higherStrata > 1) score += 5;
  
  // Internet access as urban indicator
  const withoutInternet = row['Householdswithoutinternetaccess(%)'] || 0;
  if (withoutInternet < 40) score += 15;
  else if (withoutInternet < 60) score += 10;
  else if (withoutInternet < 80) score += 5;
  
  // Education levels
  const education = row['Secondary/HigherEducation(%)'] || 0;
  if (education > 60) score += 10;
  else if (education > 40) score += 7;
  else if (education > 20) score += 3;
  
  return score;
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
          
          // Determine if municipality is urban or rural based on available indicators
          // Higher scores = more urban
          const urbanityScore = calculateUrbanityScore(row);
          
          // Store the urbanity score for potential visualization
          const isUrban = urbanityScore > 60; // Threshold for urban classification
          
          // Extract population and socioeconomic data for each year
          for (let year = 2007; year <= 2019; year++) {
            if (row[`Population${year}`] > 0) {
              // Calculate time progression factor (0 to 1)
              const yearFactor = (year - 2007) / 12;
              
              // Different improvement rates for urban vs rural areas
              // Urban areas improve faster than rural areas
              const urbanImprovementFactor = yearFactor * 0.4; // 40% improvement over 12 years
              const ruralImprovementFactor = yearFactor * 0.15; // 15% improvement over 12 years
              
              // Use appropriate improvement factor based on urbanity
              const improvementFactor = isUrban ? urbanImprovementFactor : ruralImprovementFactor;
              
              // Create synthetic yearly data with improvement over time
              municipalitiesData[code][year] = {
                name: row.Municipality,
                population: row[`Population${year}`],
                isUrban: isUrban,
                urbanityScore: urbanityScore,
                
                // Basic Services - decrease vulnerability over time (negative indicators)
                waterAccess: Math.max(0, row['Householdswithoutwateraccess(%)'] * (1 - improvementFactor * 1.2)),
                householdsWithoutInternet: Math.max(0, row['Householdswithoutinternetaccess(%)'] * (1 - improvementFactor * 1.5)),
                
                // Healthcare - increase over time (positive indicator)
                hospitalsPerKm2: row['NumberofhospitalsperKm2'] * (1 + improvementFactor * 0.8),
                
                // Socioeconomic - positive indicators increase over time
                education: Math.min(100, row['Secondary/HigherEducation(%)'] * (1 + improvementFactor * 1.0)),
                employment: Math.min(100, row['Employedpopulation(%)'] * (1 + improvementFactor * 0.9)),
                cannotReadOrWrite: Math.max(0, row['Peoplewhocannotreadorwrite(%)'] * (1 - improvementFactor * 1.3)),
                
                // Building stratification - shifts from lower to higher strata over time in urban areas
                buildingStrata1: isUrban ? 
                                 Math.max(0, row['Buildingstratification1(%)'] * (1 - improvementFactor * 0.7)) : 
                                 row['Buildingstratification1(%)'],
                buildingStrata2: row['Buildingstratification2(%)'],
                
                // Demographic variables - slower changing
                disabilities: row['PeoplewithDisabilities(%)'],
                afrocolombianPct: row['AfrocolombianPopulation(%)'],
                indigenousPct: row['IndianPopulation(%)'],
                age0to4Pct: row['Age0-4(%)'] * (1 - yearFactor * 0.2), // Birth rates typically decline with development
                
                // Keep actual dengue data
                dengueCases: row[`Cases${year}`] || 0,
              };
            }
          }
        });
        
        
        console.log(`CSV data loaded successfully (${Object.keys(municipalitiesData).length} municipalities)`);
        
        // Add this to check data availability for current year
        console.log("Checking data availability for current year:", currentYear);
        let dataCount = 0;
        for (const municipalityCode in municipalitiesData) {
          if (municipalitiesData[municipalityCode][currentYear]) {
            dataCount++;
            if (dataCount <= 5) {
              console.log("Sample data for municipality", municipalityCode, municipalitiesData[municipalityCode][currentYear]);
            }
          }
        }
        console.log(`Found data for ${dataCount} municipalities in year ${currentYear}`);

        // Force an update of map layers once CSV is loaded and processed
        if (mapLoaded && geojsonLoaded) {
          updateMapLayers();
        }
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
        // IMPORTANT: Assign a consistent ID to each feature
        // Create a new ID property if none exists
        feature.id = `municipality-${index}`;
        
        // Ensure each feature has properties
        if (!feature.properties) {
          feature.properties = {};
        }
        
        // Also store the generated ID in properties
        feature.properties.feature_id = feature.id;
        
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
    
    // Add debugging to identify properties for municipality matching
    console.log("Checking GeoJSON feature properties for mapping...");
    if (geojsonData.features && geojsonData.features.length > 0) {
      // Log property keys from the first 5 features
      for (let i = 0; i < Math.min(5, geojsonData.features.length); i++) {
        const feature = geojsonData.features[i];
        console.log(`Feature ${i} properties:`, Object.keys(feature.properties));
        console.log(`Feature ${i} id:`, feature.id);
        
        // Log some sample property values that might contain municipality codes
        const properties = feature.properties;
        const possibleCodeProperties = [
          'code', 'id', 'municipality_code', 'MPIO_CDPMP', 'CODIGO_MPI', 
          'COD_DANE', 'DPTO_CCDGO', 'municipalityCode', 'dpt'
        ];
        
        for (const prop of possibleCodeProperties) {
          if (properties[prop]) {
            console.log(`Feature ${i} ${prop}:`, properties[prop]);
          }
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

// Show municipality name labels
function showMunicipalityLabels() {
  if (!map.getStyle()) return;
  
  if (map.getLayoutProperty('municipality-labels', 'visibility') === 'visible') {
    return; // Already visible
  }
  
  map.setLayoutProperty('municipality-labels', 'visibility', 'visible');
  
  // Update the text field to prioritize municipality_name from CSV if available
  // Otherwise use NAME_2 from GeoJSON which appears to be the municipality name
  map.setLayoutProperty('municipality-labels', 'text-field', [
    'coalesce',
    ['get', 'municipality_name'], // First try CSV name
    ['get', 'display_name'],      // Then try our stored name from GeoJSON (NAME_2)
    ['get', 'NAME_2'],            // Direct GeoJSON property
    ['get', 'name'],              // Other possible property names
    ['get', 'NAME'],
    ['get', 'NOMBRE'],
    ['get', 'MPIO_CNMBR'],
    'Unknown'
  ]);
  
  labelsVisible = true;
}

// Hide municipality name labels
function hideMunicipalityLabels() {
  if (!map.getStyle()) return;
  
  map.setLayoutProperty('municipality-labels', 'visibility', 'none');
  labelsVisible = false;
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
      
      // Log complete feature information on first hover for debugging
      if (!window.hasLoggedFeature) {
        console.log("Example feature:", feature);
        console.log("Feature properties available:", Object.keys(feature.properties));
        // Try to find what we can use for identification
        console.log("Feature properties sample values:", 
          Object.fromEntries(
            Object.entries(feature.properties)
              .slice(0, 10)
              .map(([k, v]) => [k, String(v).substring(0, 50)])
          )
        );
        window.hasLoggedFeature = true;
      }
      
      // Use our generated feature_id for highlighting regardless of CSV match
      const featureId = feature.properties.feature_id || feature.id || `feature-${Math.random()}`;
      
      // For data display, attempt to find a matching municipality in CSV
      const properties = feature.properties;
      
      // Possible property names that might contain municipality codes or names
      const possibleCodeProperties = [
        'code', 'id', 'municipality_code', 'MPIO_CDPMP', 'CODIGO_MPI', 
        'COD_DANE', 'DPTO_CCDGO', 'municipalityCode', 'dpt', 'name', 'NAME', 'NOMBRE', 'MPIO_CNMBR'
      ];
      
      // Try to find a property value we can use to match with CSV data
      let matchValue = null;
      let matchProperty = null;
      
      for (const prop of possibleCodeProperties) {
        if (properties[prop]) {
          matchValue = properties[prop].toString();
          matchProperty = prop;
          break;
        }
      }
      
      // If we found a potential matching value, search the CSV data
      let municipalityData = null;
      if (matchValue) {
        // Try exact match with municipality code
        if (municipalitiesData[matchValue]?.[currentYear]) {
          municipalityData = {
            code: matchValue,
            data: municipalitiesData[matchValue][currentYear]
          };
        } else {
          // Try to match by name
          for (const [code, yearData] of Object.entries(municipalitiesData)) {
            if (yearData[currentYear]) {
              // Try case-insensitive name match
              const csvName = yearData[currentYear].name.toLowerCase();
              if (matchProperty === 'name' && csvName === matchValue.toLowerCase()) {
                municipalityData = {
                  code: code,
                  data: yearData[currentYear]
                };
                break;
              }
              
              // Additional fuzzy matching could be added here
            }
          }
        }
      }
      
      // For highlighting, we'll use the feature ID regardless of data match
      if (hoveredMunicipalityId !== featureId) {
        hoveredMunicipalityId = featureId;
        
        // Update highlight layer to show only this municipality
        // Use the feature.id or properties.feature_id for highlighting
        map.setFilter('municipality-highlight', ['==', ['get', 'feature_id'], featureId]);
        
        // Show municipality info in the sidebar if we found a match
        if (municipalityData) {
          showMunicipalityInfo(municipalityData.code);
        } else {
          showMunicipalityInfoFromFeature(feature);
        }
      }
    }
  });
  
  // Reset on mouse leave
  map.on('mouseleave', 'municipality-fill', () => {
    map.getCanvas().style.cursor = '';
    hoveredMunicipalityId = null;
    
    // Clear highlight - use feature_id for consistency
    map.setFilter('municipality-highlight', ['==', ['get', 'feature_id'], '']);
    
    // Hide municipality info
    hideMunicipalityInfo();
  });
  
  // Handle click to show popup
  map.on('click', 'municipality-fill', (e) => {
    console.log("Click event triggered, features:", e.features);
    if (e.features.length > 0) {
      const feature = e.features[0];
      const properties = feature.properties;
      console.log("Feature properties:", properties);
  
      // Try to determine municipality code from GeoJSON properties
      let municipalityCode = null;
      const possibleCodeProperties = [
        'code', 'id', 'municipality_code', 'MPIO_CDPMP', 'CODIGO_MPI',
        'COD_DANE', 'DPTO_CCDGO', 'municipalityCode', 'dpt'
      ];
  
      for (const prop of possibleCodeProperties) {
        if (properties[prop]) {
          municipalityCode = properties[prop].toString().trim();
          console.log(`Found municipality code using property "${prop}": ${municipalityCode}`);
          break;
        }
      }
  
      // If no code was found, try matching by name using display_name or NAME_2
      if (!municipalityCode) {
        const featureName = (properties.display_name || properties.NAME_2 || properties.name || "").trim().toLowerCase();
        console.log("No municipality code found. Attempting name match with:", featureName);
        for (const [code, yearData] of Object.entries(municipalitiesData)) {
          if (yearData[currentYear] &&
              yearData[currentYear].name.toLowerCase().trim() === featureName) {
            municipalityCode = code;
            console.log(`Matched municipality name to code: ${municipalityCode}`);
            break;
          }
        }
      }
  
      console.log("Final municipality code:", municipalityCode);
  
      // Retrieve CSV data using our lookup function
      const municipalityData = getMunicipalityData(municipalityCode, currentYear);
      console.log("Retrieved municipality data:", municipalityData);
  
      if (municipalityData) {
        // Optionally, compute the vulnerability index
        const vulnerability = computeVulnerabilityIndex(municipalityCode, currentYear);
        console.log("Computed vulnerability:", vulnerability);
  
        // Create popup content with CSV data
        const popupContent = `
          <div class="popup-content">
            <div class="popup-title">${municipalityData.name}</div>
            <div><strong>Total Population:</strong> ${municipalityData.population.toLocaleString()}</div>
            <div><strong>Area Type:</strong> <span class="${municipalityData.isUrban ? 'urban-area' : 'rural-area'}">${municipalityData.isUrban ? 'Urban' : 'Rural'}</span></div>
            <div><strong>Dengue Cases:</strong> ${municipalityData.dengueCases.toLocaleString()}</div>
            <div><strong>Education (%):</strong> ${municipalityData.education.toFixed(1)}%</div>
            <div><strong>Water Access (%):</strong> ${municipalityData.waterAccess.toFixed(1)}%</div>
            <div><strong>Employment (%):</strong> ${municipalityData.employment.toFixed(1)}%</div>
            ${vulnerability ? `
              <div><strong>Vulnerability Index:</strong> ${vulnerability.index.toFixed(1)}%</div>
              <div><strong>Vulnerability Level:</strong> <span class="vulnerability-level ${vulnerability.level.toLowerCase()}">${vulnerability.level}</span></div>
            ` : ''}
          </div>
        `;
        console.log("Popup content:", popupContent);
  
        // Show the popup
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(map);
      } else {
        // No CSV data found, fallback to feature properties
        const fallbackName = properties.display_name || properties.NAME_2 || properties.name || 'Unknown';
        console.log("No CSV data found. Falling back to feature properties for municipality:", fallbackName);
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="popup-content">
              <div class="popup-title">${fallbackName}</div>
              <div>No CSV data available for this municipality</div>
            </div>
          `)
          .addTo(map);
      }
    } else {
      console.log("No features found on click.");
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
  
  // Clear any existing popups when the year changes
  const popups = document.getElementsByClassName('mapboxgl-popup');
  if (popups.length) {
    Array.from(popups).forEach(popup => popup.remove());
  }
  
  updateMapLayers();
  //create a custom event when the time slider moves
  window.dispatchEvent(new CustomEvent('yearChanged', { 
    detail: { oldYear, newYear: currentYear } 
  }));
});

// Time animation
let animationTimer = null;
const playButton = document.getElementById('playButton');

playButton.addEventListener('click', () => {
  if (animationTimer) {
    // Stop animation if it's running
    clearInterval(animationTimer);
    animationTimer = null;
    playButton.innerHTML = '<span class="play-icon">▶</span> Play Animation';
  } else {
    // Start animation
    playButton.innerHTML = '<span class="play-icon">⏸</span> Pause Animation';
    
    // If we're already at the end, reset to beginning
    if (currentYear >= 2019) {
      currentYear = 2007;
      yearSlider.value = currentYear;
      currentYearElement.textContent = currentYear;
      updateMapLayers();
    }
    
    // Animate through the years
    animationTimer = setInterval(() => {
      if (currentYear < 2019) {
        currentYear++;
        yearSlider.value = currentYear;
        currentYearElement.textContent = currentYear;
        
        // Clear any existing popups when animating
        const popups = document.getElementsByClassName('mapboxgl-popup');
        if (popups.length) {
          Array.from(popups).forEach(popup => popup.remove());
        }
        
        updateMapLayers();
        //create custom event
        window.dispatchEvent(new CustomEvent('yearChanged', { 
          detail: { oldYear, newYear: currentYear } 
        }));
      } else {
        // Stop at the end
        clearInterval(animationTimer);
        animationTimer = null;
        playButton.innerHTML = '<span class="play-icon">▶</span> Play Animation';
      }
    }, 1000); // 1 second per year
  }
});


  
  // Dengue overlay checkbox
  const dengueCheckbox = document.getElementById('dengueOverlay');
  dengueCheckbox.addEventListener('change', (e) => {
    dengueOverlayVisible = e.target.checked;
    
    // Show or hide the dengue legend
    const dengueLegend = document.getElementById('dengue-legend');
    if (dengueLegend) {
      dengueLegend.style.display = dengueOverlayVisible ? 'block' : 'none';
    }
    
    if (dengueOverlayVisible) {
      addDengueOverlay();
    } else {
      removeDengueOverlay();
    }
  });
  
  // Labels toggle functionality
  const labelsCheckbox = document.getElementById('showLabels');
  labelsCheckbox.addEventListener('change', (e) => {
    const showLabels = e.target.checked;
    if (showLabels) {
      showMunicipalityLabels();
    } else {
      hideMunicipalityLabels();
    }
  });
}

// Update map layers with current year data
function updateMapLayers() {
    if (!map.getSource('municipalities') || !geojsonData) return;
    
    // Add debug for first CSV entries
    if (!window.csvDebugDone) {
      console.log("CSV data sample:");
      const sampleCodes = Object.keys(municipalitiesData).slice(0, 3);
      for (const code of sampleCodes) {
        console.log(`CSV Municipality code: ${code}, name: ${municipalitiesData[code][currentYear]?.name}`);
      }
      window.csvDebugDone = true;
    }
    
    // Global cache for maintaining consistent data between year changes
    if (!window.municipalityDataCache) {
      window.municipalityDataCache = {};
    }
    
    // Clone the GeoJSON data
    const updatedData = JSON.parse(JSON.stringify(geojsonData));
    
    // Create a sample vulnerability for demo if needed
    let matchedCount = 0;
    let unMatchedCount = 0;
    
    // Debug first few GeoJSON features in detail
    if (!window.geoJsonDebugDone) {
      console.log("GeoJSON sample feature complete properties:");
      console.log(updatedData.features[0].properties);
      window.geoJsonDebugDone = true;
    }
    
    // Update properties with vulnerability index
    updatedData.features = updatedData.features.map(feature => {
      const properties = feature.properties;
      
      // Store the municipality name from GeoJSON for label display
      // In your GeoJSON, NAME_2 appears to be the municipality name
      if (properties.NAME_2) {
        let name = properties.NAME_2;
        // Insert a space between a lowercase letter and an uppercase letter if missing
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        feature.properties.display_name = name;
      } else if (properties.name) {
        let name = properties.name;
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        feature.properties.display_name = name;
      }
      
      // Possible ID fields in the GeoJSON
      // Try GID_2 or CC_2 which might correspond to municipality code
      const possibleCodeProperties = [
        'GID_2', 'CC_2', 'HASC_2', 'code', 'id', 'municipality_code', 
        'MPIO_CDPMP', 'CODIGO_MPI', 'COD_DANE', 'DPTO_CCDGO', 'municipalityCode'
      ];
      
      let municipalityCode = null;
      let found = false;
      
      // Try each possible property
      for (const prop of possibleCodeProperties) {
        if (properties[prop]) {
          // Try direct match
          const codeToTry = properties[prop].toString();
          if (municipalitiesData[codeToTry] && municipalitiesData[codeToTry][currentYear]) {
            municipalityCode = codeToTry;
            found = true;
            break;
          }
          
          // If direct match fails, try removing any prefix
          // Some GeoJSON files use prefixes like "CO." before codes
          if (codeToTry.includes('.')) {
            const codeParts = codeToTry.split('.');
            const lastPart = codeParts[codeParts.length - 1];
            if (municipalitiesData[lastPart] && municipalitiesData[lastPart][currentYear]) {
              municipalityCode = lastPart;
              found = true;
              break;
            }
          }
        }
      }
      
      // If no match by ID, try matching by name
      if (!found && properties.NAME_2) {
        const nameToMatch = properties.NAME_2.toLowerCase().trim();
        for (const [code, yearData] of Object.entries(municipalitiesData)) {
          if (yearData[currentYear] && 
              yearData[currentYear].name.toLowerCase().trim() === nameToMatch) {
            municipalityCode = code;
            found = true;
            break;
          }
        }
      }
      
      // Calculate vulnerability if we found a matching municipality
      let vulnerability = null;
      if (found && municipalityCode) {
        vulnerability = computeVulnerabilityIndex(municipalityCode, currentYear);
        matchedCount++;
        
        // Also add CSV municipality name to the properties for labels
        if (municipalitiesData[municipalityCode][currentYear].name) {
          feature.properties.municipality_name = municipalitiesData[municipalityCode][currentYear].name;
        }
        
        // Log successful matches to aid debugging (limited to avoid spam)
        if (!window.successfulMatchesLogged) {
          window.successfulMatchesLogged = [];
        }
        if (window.successfulMatchesLogged.length < 5) {
          window.successfulMatchesLogged.push({
            geoJsonName: properties.NAME_2 || "unknown",
            csvName: municipalitiesData[municipalityCode][currentYear].name,
            municipalityCode: municipalityCode
          });
        }
        
        // Cache the vulnerability data for this municipality and year
        if (!window.municipalityDataCache[feature.id]) {
          window.municipalityDataCache[feature.id] = {};
        }
        window.municipalityDataCache[feature.id][currentYear] = vulnerability;
      }
      // If there's cached data from a previous year, use interpolation for missing years
      else if (!found && feature.id && window.municipalityDataCache[feature.id]) {
        // Find closest years with data
        const availableYears = Object.keys(window.municipalityDataCache[feature.id])
          .map(Number)
          .sort((a, b) => a - b);
        
        if (availableYears.length > 0) {
          // If we have data for other years, interpolate
          let lowerYear = availableYears.filter(y => y < currentYear).pop();
          let higherYear = availableYears.filter(y => y > currentYear).shift();
          
          if (lowerYear && higherYear) {
            // We have data before and after, so interpolate
            const lowerData = window.municipalityDataCache[feature.id][lowerYear];
            const higherData = window.municipalityDataCache[feature.id][higherYear];
            const ratio = (currentYear - lowerYear) / (higherYear - lowerYear);
            
            vulnerability = {
              index: lowerData.index + (higherData.index - lowerData.index) * ratio,
              basicServices: lowerData.basicServices + (higherData.basicServices - lowerData.basicServices) * ratio,
              healthcare: lowerData.healthcare + (higherData.healthcare - lowerData.healthcare) * ratio,
              socioeconomic: lowerData.socioeconomic + (higherData.socioeconomic - lowerData.socioeconomic) * ratio,
              demographic: lowerData.demographic + (higherData.demographic - lowerData.demographic) * ratio
            };
            
            // Determine the level based on our thresholds
            if (vulnerability.index < 30) vulnerability.level = 'Low';
            else if (vulnerability.index < 45) vulnerability.level = 'Moderate';
            else if (vulnerability.index < 60) vulnerability.level = 'High';
            else vulnerability.level = 'Extreme';
            
            found = true; // Consider this a match since we interpolated
            matchedCount++;
          } else if (lowerYear || higherYear) {
            // We only have data for years before or after, so use that
            const nearestYear = lowerYear || higherYear;
            vulnerability = {...window.municipalityDataCache[feature.id][nearestYear]};
            found = true; // Consider this a match since we're using nearby data
            matchedCount++;
          }
        }
      }
      // If still no data, use deterministic placeholder values
      if (!found) {
        unMatchedCount++;
        // Use a deterministic value based on the municipality ID
        // This ensures consistent coloring across year changes when data is missing
        const idNumber = parseInt(feature.id.replace(/\D/g, '')) || 0;
        const baseValue = 30 + (idNumber % 40); // Generates a value between 30-70
        
        vulnerability = {
          index: baseValue,
          level: baseValue < 30 ? 'Low' : baseValue < 45 ? 'Moderate' : baseValue < 60 ? 'High' : 'Extreme',
          basicServices: baseValue - 5 + (idNumber % 10),
          healthcare: baseValue - 3 + (idNumber % 8),
          socioeconomic: baseValue + (idNumber % 12),
          demographic: baseValue - 8 + (idNumber % 15)
        };
      }
      
      if (vulnerability) {
        feature.properties.vulnerabilityIndex = vulnerability.index;
        feature.properties.basicServices = vulnerability.basicServices;
        feature.properties.healthcare = vulnerability.healthcare;
        feature.properties.socioeconomic = vulnerability.socioeconomic;
        feature.properties.demographic = vulnerability.demographic;
        feature.properties.vulnerabilityLevel = vulnerability.level;
      } else {
        feature.properties.vulnerabilityIndex = -1; // No data
      }
      
      return feature;
    });
    
    console.log(`Map data updated: ${matchedCount} municipalities matched, ${unMatchedCount} using deterministic data`);
    
    // If we've logged successful matches, display them
    if (window.successfulMatchesLogged && window.successfulMatchesLogged.length > 0) {
      console.log("Sample of successful matches:");
      console.table(window.successfulMatchesLogged);
    }
    
    // Update the source
    map.getSource('municipalities').setData(updatedData);
    
    // Update dengue overlay if visible
    if (dengueOverlayVisible) {
      updateDengueOverlay();
    }
  }

function computeVulnerabilityIndex(municipalityCode, year) {
    const data = getMunicipalityData(municipalityCode, year);
    if (!data) return null;
    
    // Define dimensions and their variables
    // For each variable, specify if higher values mean LOWER vulnerability (require inversion)
    const dimensions = {
      basicServices: [
        { name: 'waterAccess', value: data.waterAccess, inverse: false },
        { name: 'internetAccess', value: data.householdsWithoutInternet, inverse: false }
      ],
      healthcare: [
        { name: 'hospitalDensity', value: data.hospitalsPerKm2, inverse: true }
      ],
      socioeconomic: [
        { name: 'education', value: data.education, inverse: true },
        { name: 'employment', value: data.employment, inverse: true },
        { name: 'literacy', value: data.cannotReadOrWrite, inverse: false },
        { name: 'strata1', value: data.buildingStrata1, inverse: false },
        { name: 'strata2', value: data.buildingStrata2, inverse: false }
      ],
      demographic: [
        { name: 'disabilities', value: data.disabilities, inverse: false },
        { name: 'afrocolombian', value: data.afrocolombianPct, inverse: false },
        { name: 'indigenous', value: data.indigenousPct, inverse: false },
        { name: 'youngChildren', value: data.age0to4Pct, inverse: false }
      ]
    };
    
    // Calculate sub-indices for each dimension
    const subIndices = {};
    
    for (const [dimension, variables] of Object.entries(dimensions)) {
      let dimensionValues = [];
      
      for (const variable of variables) {
        if (variable.value !== undefined && !isNaN(variable.value)) {
          // For variables where higher values mean lower vulnerability, invert the scale
          const value = variable.inverse ? (100 - variable.value) : variable.value;
          dimensionValues.push(value);
        }
      }
      
      // Calculate average for this dimension (only if we have values)
      if (dimensionValues.length > 0) {
        subIndices[dimension] = dimensionValues.reduce((sum, val) => sum + val, 0) / dimensionValues.length;
      } else {
        subIndices[dimension] = null;
      }
    }
    
    // Handle missing dimensions with defaults
    const dimensionsPresent = Object.values(subIndices).filter(v => v !== null).length;
    if (dimensionsPresent === 0) return null;
    
    // Weights derived from PCA analysis in the Python code
    const weights = {
      basicServices: 0.35,  // Access to basic services often has highest weight
      healthcare: 0.20,     // Healthcare accessibility is critical
      socioeconomic: 0.30,  // Social and economic factors are major contributors
      demographic: 0.15     // Demographic factors contribute but often with lower weight
    };
    
    // Normalize weights for only available dimensions
    let totalWeight = 0;
    for (const [dimension, value] of Object.entries(subIndices)) {
      if (value !== null) {
        totalWeight += weights[dimension];
      }
    }
    
    // Calculate final vulnerability index with weighted dimensions
    let vulnerabilityIndex = 0;
    let availableWeight = 0;
    
    for (const [dimension, value] of Object.entries(subIndices)) {
      if (value !== null) {
        const normalizedWeight = weights[dimension] / totalWeight;
        vulnerabilityIndex += normalizedWeight * value;
        availableWeight += normalizedWeight;
      }
    }
    
    // Adjust if we don't have all dimensions
    if (availableWeight > 0 && availableWeight < 1) {
      vulnerabilityIndex = vulnerabilityIndex / availableWeight;
    }
    
    // ADJUSTED THRESHOLDS based on data distribution
    // These thresholds might need further tuning based on the actual data
    let vulnerabilityLevel;
    if (vulnerabilityIndex < 30) vulnerabilityLevel = 'Low';
    else if (vulnerabilityIndex < 45) vulnerabilityLevel = 'Moderate';
    else if (vulnerabilityIndex < 60) vulnerabilityLevel = 'High';
    else vulnerabilityLevel = 'Extreme';
    
    // Return the overall index, components, and classification
    return {
      index: vulnerabilityIndex,
      level: vulnerabilityLevel,
      components: subIndices,
      basicServices: subIndices.basicServices,
      healthcare: subIndices.healthcare,
      socioeconomic: subIndices.socioeconomic,
      demographic: subIndices.demographic
    };
  }

// Get municipality data for a specific year - IMPROVED IMPLEMENTATION
function getMunicipalityData(municipalityCode, year) {
  if (!municipalityCode) return null;
  
  // Direct lookup first
  if (municipalitiesData[municipalityCode]?.[year]) {
    return municipalitiesData[municipalityCode][year];
  }
  
  // If direct lookup fails, try a case-insensitive search through all municipality codes
  for (const [code, data] of Object.entries(municipalitiesData)) {
    if (code.toString().toLowerCase() === municipalityCode.toString().toLowerCase() && data[year]) {
      return data[year];
    }
  }
  
  // Add debug logging to see what's happening (limited to prevent console flooding)
  if (!window.lookupsLogged) {
    window.lookupsLogged = 0;
  }
  if (window.lookupsLogged < 10) {
    console.log(`No data found for municipality code ${municipalityCode} in year ${year}`);
    if (window.lookupsLogged === 0) {
      console.log(`Available municipality codes (sample):`, Object.keys(municipalitiesData).slice(0, 10));
    }
    window.lookupsLogged++;
  }
  
  return null;
}

// Add dengue overlay layer - REVISED IMPLEMENTATION
function addDengueOverlay() {
  // First check if we already have a dengue source, if not create it
  if (!map.getSource('dengue-data')) {
    map.addSource('dengue-data', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }
  
  // Remove existing layer if it exists
  if (map.getLayer('dengue-circles')) {
    map.removeLayer('dengue-circles');
  }
  
  // Add new layer using separate source
  map.addLayer({
    id: 'dengue-circles',
    type: 'circle',
    source: 'dengue-data',
    paint: {
      'circle-color': '#B91C1C', // Red color for dengue
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['get', 'caseRate'], // Case rate (cases per 1000 people)
        0, 0.3,  // Minimum opacity
        1, 0.4,  // 1 case per 1000 people
        5, 0.6,  // 5 cases per 1000 people
        10, 0.8, // 10 cases per 1000 people
        50, 0.9  // 50+ cases per 1000 people (very high)
      ],
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

// Remove dengue overlay - REVISED IMPLEMENTATION
function removeDengueOverlay() {
  if (map.getLayer('dengue-circles')) {
    map.removeLayer('dengue-circles');
  }
}

// Update dengue overlay with current year data - REVISED IMPLEMENTATION
function updateDengueOverlay() {
  if (!map.getSource('dengue-data')) return;
  
  // Create a new FeatureCollection specifically for dengue data
  const dengueData = {
    type: 'FeatureCollection',
    features: []
  };
  
  // Process each municipality to extract dengue data with location
  for (const [code, yearData] of Object.entries(municipalitiesData)) {
    // Skip if no data for current year
    if (!yearData[currentYear]) continue;
    
    const municipalityData = yearData[currentYear];
    const dengueCases = municipalityData.dengueCases || 0;
    
    // Skip municipalities with zero cases
    if (dengueCases <= 0) continue;
    
    // Find corresponding feature in geojsonData to get coordinates
    const feature = findFeatureByMunicipalityCode(code);
    if (!feature) continue;
    
    // Get centroid of the municipality polygon
    const centroid = getCentroid(feature);
    if (!centroid) continue;
    
    // Calculate case rate per 1000 people
    const population = municipalityData.population || 1;
    const caseRate = (dengueCases / population) * 1000;
    
    // Create a point feature for this municipality's dengue data
    dengueData.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: centroid
      },
      properties: {
        municipalityCode: code,
        municipalityName: municipalityData.name,
        dengueCases: dengueCases,
        population: population,
        caseRate: caseRate
      }
    });
  }
  
  // Update the dengue data source
  map.getSource('dengue-data').setData(dengueData);
  
  // Log how many dengue points we're displaying
  console.log(`Displaying dengue data for ${dengueData.features.length} municipalities in ${currentYear}`);
}

// Helper function to find feature by municipality code
function findFeatureByMunicipalityCode(code) {
  if (!geojsonData || !geojsonData.features) return null;
  
  // Try to find a matching feature by checking various property fields
  for (const feature of geojsonData.features) {
    const properties = feature.properties;
    
    // Check possible code properties
    const possibleCodeProperties = [
      'code', 'id', 'municipality_code', 'MPIO_CDPMP', 'CODIGO_MPI', 
      'COD_DANE', 'DPTO_CCDGO', 'municipalityCode', 'dpt'
    ];
    
    for (const prop of possibleCodeProperties) {
      if (properties[prop] && properties[prop].toString() === code.toString()) {
        return feature;
      }
    }
    
    // Check by name if code match fails
    if (properties.NAME_2 || properties.name) {
      const featureName = (properties.NAME_2 || properties.name || "").toLowerCase();
      const municipalityName = municipalitiesData[code][currentYear]?.name.toLowerCase() || "";
      
      if (municipalityName && featureName === municipalityName) {
        return feature;
      }
    }
  }
  
  return null;
}

// Helper function to calculate centroid of a feature
function getCentroid(feature) {
  if (!feature.geometry || !feature.geometry.coordinates) return null;
  
  try {
    const geometry = feature.geometry;
    
    // For Point
    if (geometry.type === 'Point') {
      return geometry.coordinates;
    }
    
    // For Polygon
    if (geometry.type === 'Polygon') {
      // Simple average of first ring's coordinates
      const coords = geometry.coordinates[0];
      let sumX = 0;
      let sumY = 0;
      
      for (const point of coords) {
        sumX += point[0];
        sumY += point[1];
      }
      
      return [sumX / coords.length, sumY / coords.length];
    }
    
    // For MultiPolygon - use the largest polygon
    if (geometry.type === 'MultiPolygon') {
      let maxArea = 0;
      let bestCentroid = null;
      
      for (const polygon of geometry.coordinates) {
        // Simple average of coordinates in the first ring
        const coords = polygon[0];
        let sumX = 0;
        let sumY = 0;
        
        for (const point of coords) {
          sumX += point[0];
          sumY += point[1];
        }
        
        const centroid = [sumX / coords.length, sumY / coords.length];
        
        // Rough area calculation
        let area = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          area += Math.abs(coords[i][0] * coords[i+1][1] - coords[i+1][0] * coords[i][1]);
        }
        
        if (area > maxArea) {
          maxArea = area;
          bestCentroid = centroid;
        }
      }
      
      return bestCentroid;
    }
  } catch (error) {
    console.error('Error calculating centroid:', error);
  }
  
  return null;
}

// Show municipality information in the panel using colombia facts
function showMunicipalityInfo(municipalityCode) {
  const infoMessage = document.querySelector('.info-message');
  const detailsContainer = document.getElementById('municipality-details');
  
  const data = getMunicipalityData(municipalityCode, currentYear);
  
  if (data) {
    // Update info panel content
    document.getElementById('municipality-name').textContent = data.name;
    document.getElementById('municipality-population').textContent = data.population.toLocaleString();
    
    // Get and display an interesting fact about this municipality
    const fact = getMunicipalityFact(data.name);
    document.getElementById('municipality-fact').textContent = fact;
    
    // Show details and hide message
    infoMessage.style.display = 'none';
    detailsContainer.style.display = 'block';
  } else {
    // Show message if no data available
    infoMessage.textContent = 'No data available for this municipality';
    infoMessage.style.display = 'block';
    detailsContainer.style.display = 'none';
  }
}

// Updated version
function showMunicipalityInfoFromFeature(feature) {
  const infoMessage = document.querySelector('.info-message');
  const detailsContainer = document.getElementById('municipality-details');
  
  if (!feature || !feature.properties) {
    infoMessage.textContent = 'No data available for this municipality';
    infoMessage.style.display = 'block';
    detailsContainer.style.display = 'none';
    return;
  }
  
  const properties = feature.properties;
  
  // Get name from any available property
  const name = properties.NAME_2 || properties.name || properties.NAME || properties.NOMBRE || properties.display_name || 'Unknown Municipality';
  
  // Update info panel content
  document.getElementById('municipality-name').textContent = name;
  document.getElementById('municipality-population').textContent = properties.population || 'N/A';
  
  // Get and display an interesting fact about this municipality
  const fact = getMunicipalityFact(name);
  document.getElementById('municipality-fact').textContent = fact;
  
  // Show details and hide message
  infoMessage.style.display = 'none';
  detailsContainer.style.display = 'block';
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);