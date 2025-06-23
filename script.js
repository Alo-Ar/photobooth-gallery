let autoRefreshInterval;
let lastPhotoCount = 0;

// Load photos when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadPhotos();
    setupAutoRefresh();
});

async function loadPhotos() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const gallery = document.getElementById('gallery');
    const noPhotos = document.getElementById('no-photos');
    
    // Show loading
    loading.style.display = 'block';
    error.style.display = 'none';
    noPhotos.style.display = 'none';
    
    try {
        console.log('Loading photos from photos.json...');
        
        // Add cache busting to ensure we get the latest data
        const response = await fetch('photos.json?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const photos = await response.json();
        console.log(`Loaded ${photos.length} photos`);
        
        // Hide loading
        loading.style.display = 'none';
        
        if (photos.length === 0) {
            noPhotos.style.display = 'block';
            gallery.innerHTML = '';
            return;
        }
        
        // Sort by timestamp (newest first)
        photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Check for new photos
        const hasNewPhotos = photos.length > lastPhotoCount;
        lastPhotoCount = photos.length;
        
        // Clear and rebuild gallery
        gallery.innerHTML = '';
        
        photos.forEach((photo, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-item';
            
            // Add animation class for new photos
            if (hasNewPhotos && index === 0) {
                photoDiv.classList.add('new');
            }
            
            const timestamp = new Date(photo.timestamp);
            const formattedTime = timestamp.toLocaleDateString() + ' at ' + 
                                timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Extract filename from URL for download
            const filename = `${photo.id || 'photo'}.jpg`;
            
            // Show only first 3 words for display
            const fullCompliment = photo.compliment || 'A beautiful moment captured';
            const displayCompliment = getFirstThreeWords(fullCompliment);
            
            photoDiv.innerHTML = `
                <img src="${photo.url}" alt="Photobooth capture" loading="lazy" 
                     onerror="this.parentElement.style.display='none'">
                <div class="photo-info">
                    <p class="compliment">"${escapeHtml(displayCompliment)}"</p>
                    <p class="timestamp">${formattedTime}</p>
                    <button class="download-btn" data-url="${photo.url}" data-filename="${filename}" data-compliment="${escapeHtml(fullCompliment)}">
                        📥 Download Photo
                    </button>
                </div>
            `;
            
            // Add click event listener to the download button
            const downloadBtn = photoDiv.querySelector('.download-btn');
            downloadBtn.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                const filename = this.getAttribute('data-filename');
                const compliment = this.getAttribute('data-compliment');
                downloadPhoto(url, filename, compliment);
            });
            
            gallery.appendChild(photoDiv);
        });
        
        // Show notification for new photos
        if (hasNewPhotos && lastPhotoCount > 1) {
            showNotification('✨ New photo added!');
        }
        
    } catch (error) {
        console.error('Error loading photos:', error);
        loading.style.display = 'none';
        document.getElementById('error').style.display = 'block';
    }
}

function setupAutoRefresh() {
    const checkbox = document.getElementById('auto-refresh');
    const status = document.getElementById('refresh-status');
    
    // Only set up if auto-refresh elements exist (since we removed them from HTML)
    if (!checkbox || !status) {
        return;
    }
    
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            startAutoRefresh();
            status.textContent = 'ON';
        } else {
            stopAutoRefresh();
            status.textContent = 'OFF';
        }
    });
    
    // Start auto-refresh by default
    if (checkbox.checked) {
        startAutoRefresh();
    }
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing interval
    autoRefreshInterval = setInterval(loadPhotos, 10000); // Refresh every 10 seconds
    console.log('Auto-refresh enabled (10 seconds)');
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    console.log('Auto-refresh disabled');
}

function getFirstThreeWords(text) {
    if (!text || text.trim() === '') return 'A beautiful moment captured';
    const words = text.trim().split(/\s+/);
    if (words.length <= 3) return text;
    return words.slice(0, 3).join(' ') + '...';
}

function downloadPhoto(url, filename, fullCompliment) {
    // For now, we'll just download the original image
    // In the future, you could modify this to overlay the full text on the image
    
    // Method 1: Try direct download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Method 2: Fetch and download (for cross-origin images)
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the blob URL
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
            console.error('Download failed:', err);
            // Fallback: open in new tab
            window.open(url, '_blank');
        });
    
    // Optional: Show the full compliment in a notification when downloading
    if (fullCompliment && fullCompliment !== 'A beautiful moment captured') {
        showNotification(`Full message: "${fullCompliment}"`);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add CSS for animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Handle visibility change (when user switches tabs)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && document.getElementById('auto-refresh') && document.getElementById('auto-refresh').checked) {
        loadPhotos(); // Refresh when user returns to tab
    }
});
