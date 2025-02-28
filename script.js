document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('userForm');
    const formContainer = document.getElementById('formContainer');
    const simulationContainer = document.getElementById('simulationContainer');
    const canvas = document.getElementById('simulationCanvas');
    const ctx = canvas.getContext('2d');
    
    // Control elements
    const copRange = document.getElementById('copRange');
    const forceRange = document.getElementById('forceRange');
    const surfaceTypeSelect = document.getElementById('surfaceType');
    
    // Simulation parameters
    let userData = {};
    let copOffset = 0;     // Adjusted via slider (in pixels)
    let appliedForce = 0;  // Adjusted via slider (arbitrary units)
    let surfaceType = 'firm';
    let angle = 0;         // Stick figure tilt (in radians)
    let angularVelocity = 0;
    
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Collect user data
        userData.age = document.getElementById('age').value;
        userData.gender = document.getElementById('gender').value;
        userData.height = document.getElementById('height').value;
        userData.weight = document.getElementById('weight').value;
        userData.footwear = document.getElementById('footwear').value;
        
        // Hide the form and display the simulation container
        formContainer.style.display = 'none';
        simulationContainer.style.display = 'block';
        
        // Initialize simulation parameters (could be further customized by userData)
        initSimulation();
        requestAnimationFrame(update);
    });
    
    // Listen for control adjustments
    copRange.addEventListener('input', function() {
        copOffset = parseInt(copRange.value);
    });
    
    forceRange.addEventListener('input', function() {
        appliedForce = parseInt(forceRange.value);
    });
    
    surfaceTypeSelect.addEventListener('change', function() {
        surfaceType = surfaceTypeSelect.value;
    });
    
    function initSimulation() {
        angle = 0;
        angularVelocity = 0;
    }
    
    function update() {
        // Clear canvas for next frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the background surface
        drawSurface();
        
        // Update simulation physics
        updatePhysics();
        
        // Draw the stick figure
        drawStickFigure();
        
        // Draw the center-of-pressure indicator
        drawCOP();
        
        // Loop the update
        requestAnimationFrame(update);
    }
    
    function updatePhysics() {
        // Adjust damping based on surface type
        let damping = 0.98;
        if (surfaceType === 'soft') {
            damping = 0.95;
        } else if (surfaceType === 'uneven') {
            damping = 0.90;
        }
        
        // Calculate a simple torque: difference between applied force and a factor from the COP offset
        let torque = appliedForce - copOffset * 0.1;  // The factor 0.1 is arbitrary for demo
        
        // Update angular velocity and angle (using a small time step factor)
        angularVelocity += torque * 0.001;
        angularVelocity *= damping;
        angle += angularVelocity;
        
        // Constrain the angle to avoid unrealistic tilting
        if (angle > 0.5) angle = 0.5;
        if (angle < -0.5) angle = -0.5;
    }
    
    function drawSurface() {
        // Set surface color based on type
        if (surfaceType === 'firm') {
            ctx.fillStyle = '#8B4513'; // Brown
        } else if (surfaceType === 'soft') {
            ctx.fillStyle = '#C0C0C0'; // Light gray
        } else if (surfaceType === 'uneven') {
            ctx.fillStyle = '#A9A9A9'; // Dark gray
        }
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    }
    
    function drawStickFigure() {
        ctx.save();
        // Translate to a base point (centered horizontally and on the surface)
        ctx.translate(canvas.width / 2, canvas.height - 50);
        // Rotate according to the simulation angle
        ctx.rotate(angle);
        
        // Draw head
        ctx.beginPath();
        ctx.arc(0, -60, 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw body
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(0, -20);
        ctx.stroke();
        
        // Draw arms
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(-15, -30);
        ctx.moveTo(0, -40);
        ctx.lineTo(15, -30);
        ctx.stroke();
        
        // Draw legs
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-10, 0);
        ctx.moveTo(0, -20);
        ctx.lineTo(10, 0);
        ctx.stroke();
        
        ctx.restore();
    }
    
    function drawCOP() {
        ctx.save();
        ctx.fillStyle = 'red';
        // The COP indicator is drawn near the base (feet). Its horizontal position shifts based on copOffset.
        let baseX = canvas.width / 2;
        let baseY = canvas.height - 50;
        let copX = baseX + copOffset;
        ctx.beginPath();
        ctx.arc(copX, baseY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
});

