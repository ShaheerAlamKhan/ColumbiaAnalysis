# Colombia Vulnerability Analysis

## Overview
This interactive web application visualizes socioeconomic vulnerability across Colombia's 1,121 municipalities from 2007 to 2019. The project combines geospatial mapping, data visualization, and interactive elements to help users understand patterns of vulnerability across Colombia's diverse regions.

## Features

- **Interactive Vulnerability Map**: Color-coded visualization of vulnerability levels across all Colombian municipalities
- **Time-based Analysis**: Explore how vulnerability has changed from 2007 to 2019 with a slider control
- **Animation**: Automated playback showing the evolution of vulnerability over time
- **Regional Analysis**: Radar chart visualization comparing vulnerability dimensions across Colombia's major regions
- **Dengue Overlay**: Optional visualization showing dengue case distribution
- **Cultural Context**: Interesting facts about municipalities to provide cultural and historical background
- **Interactive Elements**: Hover and click interactions for detailed information

## Data Sources

This application uses several key data sources:

1. **Municipality Metadata (CSV)**: Comprehensive socioeconomic data for 1,121 Colombian municipalities including:
   - Population data (2007-2019)
   - Dengue cases by year
   - Demographic information (age distribution, ethnicity, literacy)
   - Socioeconomic indicators (education, employment)
   - Infrastructure metrics (water access, internet access)
   - Healthcare accessibility (hospitals per km²)

2. **Geographic Data (GeoJSON)**: Municipal boundaries for geographic visualization

3. **Colombia Facts Database**: Collection of interesting cultural, historical, and geographical facts about Colombian municipalities

## Vulnerability Index

The application calculates a composite vulnerability index (0-100) for each municipality based on four key dimensions:

- **Basic Services (35%)**: Water access, internet access
- **Healthcare (20%)**: Hospital density and accessibility
- **Socioeconomic (30%)**: Education, employment, literacy rates
- **Demographic (15%)**: Proportion of vulnerable populations

Municipalities are classified into four vulnerability levels:
- **Low**: 0-30%
- **Moderate**: 30-45%
- **High**: 45-60%
- **Extreme**: 60-100%

## Technical Implementation

The application is built with:

- **Mapbox GL JS**: For interactive map visualization
- **D3.js**: For custom data visualizations (radar charts)
- **PapaParse**: For CSV data processing
- **JavaScript/HTML/CSS**: Core technologies

Key components include:

- `script.js`: Core application logic and data processing
- `animation.js`: Enhanced transitions and animations
- `colombia-facts.js`: Database of municipality facts
- `vulnerability-drivers.js`: Regional vulnerability visualization

## Getting Started

### Prerequisites
- Web browser with JavaScript enabled
- Internet connection (for loading Mapbox resources)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/colombia-vulnerability-analysis.git
   ```

2. Navigate to the project directory:
   ```
   cd colombia-vulnerability-analysis
   ```

3. Open `index.html` in your browser or use a local server:
   ```
   python -m http.server
   ```
   Then navigate to `http://localhost:8000` in your browser.

## Usage

- **Time Navigation**: Use the slider at the top to select a specific year
- **Animation**: Click the "Play Animation" button to see changes over time
- **Region Information**: Hover over municipalities to see details and interesting facts
- **Detailed Data**: Click on municipalities for detailed vulnerability statistics
- **Layer Toggles**: Use the checkboxes to show/hide dengue data and municipality labels
- **Regional Analysis**: Explore the radar chart to compare vulnerability dimensions across regions

## Contributors

- Shaheer Khan
- Samuel Mahjouri
- Zoya Hasan
- Shruti Yamala

## License

This project is licensed under the MIT License.

## Acknowledgments

- Data sources: Colombian government statistical agencies
- MapBox for mapping technology
- D3.js for visualization capabilities
- PapaParse for CSV parsing
